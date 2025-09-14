#!/bin/bash
# Deploy Docker Stacks Script (Updated with Private Registry)
# File: scripts/deploy-stacks.sh

set -e

source .env

MANAGER_IP=$1
WORKER1_IP=$2
WORKER2_IP=$3
SSH_USER=root
SSH_PASS=regex-33
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"
REGISTRY_URL="$MANAGER_IP:5000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to execute commands via SSH
ssh_exec() {
    sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$SSH_USER@$MANAGER_IP" "$1"
}

ssh_exec_logging() {
    sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$SSH_USER@$WORKER1_IP" "$1"
}

ssh_exec_monitoring() {
    sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$SSH_USER@$WORKER2_IP" "$1"
}

# Function to copy files via SCP
scp_copy() {
    sshpass -p "$SSH_PASS" scp $SSH_OPTS "$1" "$SSH_USER@$MANAGER_IP:$2"
}

scp_copy_folder() {
    sshpass -p "$SSH_PASS" scp -r $SSH_OPTS "$1" "$SSH_USER@$MANAGER_IP:$2"
}

echo -e "${BLUE} Deploying Docker Stacks with Private Registry${NC}"

# Install sshpass on manager node if not already installed
echo -e "${YELLOW}Installing sshpass on manager node...${NC}"
ssh_exec "
if ! command -v sshpass &> /dev/null; then
    if command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        yum install -y sshpass
    elif command -v apk &> /dev/null; then
        apk add --no-cache sshpass
    else
        echo 'Cannot install sshpass - unsupported package manager'
        exit 1
    fi
fi
"

# Create deployment directory on manager
echo -e "${YELLOW}Creating deployment directory...${NC}"
ssh_exec "rm -rf /opt/transcendence/deploy && mkdir -p /opt/transcendence/deploy"

# Copy application files to manager
echo -e "${YELLOW}Copying application files...${NC}"
scp_copy_folder "./" "/opt/transcendence/deploy/"

# Setup Traefik
echo -e "${BLUE} Setting up Traefik...${NC}"
ssh_exec "mkdir -p /opt/traefik/data /opt/traefik/certs \
            && cd /opt/transcendence/deploy \
            && cp ./services/devops/traefik/certs/* /opt/traefik/certs/ || true \
            && chmod 600 /opt/traefik/certs/*.key || true \
            && chmod 644 /opt/traefik/certs/*.crt || true"



# Setup Logging Directory
echo -e "${YELLOW}Creating logging directory...${NC}"
scp_copy "./services/devops/logging/setup/create-log-structure.sh" "/opt/transcendence/deploy/"
# Check if the Logging structure was already exists:
if ssh_exec "tree /var/log/ft-transcendence"; then
    echo -e "${GREEN}✓ Logging structure already exists.${NC}"
else
    echo -e "${YELLOW}Creating logging structure...${NC}"
    scp_exec "chmod +x /opt/transcendence/deploy/create-log-structure.sh && bash /opt/transcendence/deploy/create-log-structure.sh && tree /var/log/ft-transcendence"
    echo -e "${GREEN}✓ Logging structure created successfully.${NC}"
fi

# Copy compose files to manager
echo -e "${YELLOW}Copying compose files...${NC}"
scp_copy "stacks/docker-compose.app.yml" "/opt/transcendence/deploy/"
scp_copy "stacks/docker-compose.logging.yml" "/opt/transcendence/deploy/"
scp_copy "stacks/docker-compose.monitoring.yml" "/opt/transcendence/deploy/"
scp_copy "stacks/docker-compose.registry.yml" "/opt/transcendence/deploy/"
scp_copy "stacks/docker-compose.traefik.yml" "/opt/transcendence/deploy/"
scp_copy "stacks/docker-compose.logging.yml" "/opt/transcendence/deploy/"
scp_copy ".env" "/opt/transcendence/deploy/"

# Update compose files to use registry images
echo -e "${YELLOW}Updating compose files to use private registry...${NC}"
ssh_exec "
cd /opt/transcendence/deploy

# Function to update image references in compose files
update_compose_file() {
    local file=\$1
    echo \"Updating \$file to use private registry...\"
    
    # Update all ft_transcendence images to use registry
    sed -i 's|image: ft_transcendence/|image: $REGISTRY_URL/ft_transcendence/|g' \"\$file\"
    
    echo \"Updated \$file\"
}

# Update all compose files
update_compose_file docker-compose.app.yml
update_compose_file docker-compose.logging.yml
update_compose_file docker-compose.monitoring.yml
update_compose_file docker-compose.registry.yml
update_compose_file docker-compose.traefik.yml
update_compose_file docker-compose.vault.yml

# Verify changes
echo \"=== Updated image references ===\"
grep \"image: $REGISTRY_URL\" *.yml || echo \"No registry images found in compose files\"
"


# Check if registry is running, if not deploy it
echo -e "${YELLOW}Checking if registry is running...${NC}"
if ! ssh_exec "curl -s http://$MANAGER_IP:5000/v2/ > /dev/null"; then

    echo -e "${YELLOW}Registry not running, deploying it first...${NC}"
    ssh_exec "cd /opt/transcendence/deploy && docker stack deploy -c docker-compose.registry.yml ft-registry"
    
    # Wait for registry to be ready
    echo -e "${YELLOW}Waiting for registry to be ready...${NC}"
    for i in {1..12}; do
        if ssh_exec "curl -s http://$MANAGER_IP:5000/v2/ | grep -q '{}'"; then
            echo -e "${GREEN}✓ Registry is ready${NC}"
            break
        fi
        echo -e "${YELLOW}Waiting for registry... (attempt $i/30)${NC}"
        sleep 5
    done
fi

# Pull images from registry to verify they exist
echo -e "${YELLOW}Verifying images in private registry...${NC}"
MISSING_IMAGES=()

IMAGES=(
    "ft_transcendence/frontend"
    "ft_transcendence/user-service"
    "ft_transcendence/chat-service"
    "ft_transcendence/nginx"
    "ft_transcendence/postgres"
    "ft_transcendence/redis"
    "ft_transcendence/elasticsearch"
    "ft_transcendence/logstash"
    "ft_transcendence/kibana"
    "ft_transcendence/filebeat"
    "ft_transcendence/prometheus"
    "ft_transcendence/grafana"
    "ft_transcendence/traefik"
    "ft_transcendence/vault"
)

for image in "${IMAGES[@]}"; do
    registry_image="$REGISTRY_URL/$image"
    echo -n -e "${YELLOW}Checking $registry_image... ${NC}"
    
    if ssh_exec "docker pull $registry_image > /dev/null 2>&1"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        MISSING_IMAGES+=("$image")
    fi
done

if [ ${#MISSING_IMAGES[@]} -gt 0 ]; then
    echo -e "${RED}✗ Missing images in registry:${NC}"
    for image in "${MISSING_IMAGES[@]}"; do
        echo -e "  - $image"
    done
    echo -e "${YELLOW}Please run 'make push-images' first to push images to the registry${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required images are available in the registry${NC}"

# Deploy stacks in order
echo -e "${BLUE} Deploying stacks...${NC}"


# 1. Deploy Traefik stack
echo -e "${YELLOW}Deploying Traefik stack...${NC}"
ssh_exec "cd /opt/transcendence/deploy && source .env && docker stack deploy -c docker-compose.traefik.yml ft-traefik"


# 1. Deploy main application stack
echo -e "${YELLOW}Deploying main application stack...${NC}"
ssh_exec "cd /opt/transcendence/deploy && source .env && docker stack deploy -c docker-compose.app.yml ft-app"

# Wait for application deployment
echo -e "${YELLOW}Waiting for application stack to initialize...${NC}"
sleep 60

# 2. Deploy logging stack
echo -e "${YELLOW}Deploying logging stack...${NC}"
ssh_exec "cd /opt/transcendence/deploy && source .env && docker stack deploy -c docker-compose.logging.yml ft-logging"

# Wait for logging stack to be ready
echo -e "${YELLOW}Waiting for logging stack to initialize...${NC}"
sleep 120

# Check if Elasticsearch is ready
echo -e "${YELLOW}Checking Elasticsearch readiness...${NC}"
for i in {1..10}; do
    if ssh_exec "curl -s https://$WORKER1_IP:9200/_cluster/health -k | grep -q 'yellow\\|green'"; then
        echo -e "${GREEN}✓ Elasticsearch is ready${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting for Elasticsearch... (attempt $i/10)${NC}"
    sleep 10
done

# 3. Deploy monitoring stack
echo -e "${YELLOW}Deploying monitoring stack...${NC}"
ssh_exec "cd /opt/transcendence/deploy && source .env && docker stack deploy -c docker-compose.monitoring.yml ft-monitoring"

# Wait for monitoring stack
echo -e "${YELLOW}Waiting for monitoring stack to initialize...${NC}"
sleep 60

# Check deployment status
echo -e "${BLUE} Checking deployment status...${NC}"

# Function to check service health
check_service_health() {
    local stack=$1
    echo -e "${YELLOW}Checking $stack services:${NC}"
    ssh_exec "docker service ls --filter label=com.docker.stack.namespace=$stack"
}

# Check all stacks
check_service_health "ft-traefik"
check_service_health "ft-registry"
check_service_health "ft-app"
check_service_health "ft-logging"
check_service_health "ft-monitoring"

# Wait for all services to be running
echo -e "${YELLOW}Waiting for all services to be running...${NC}"
for i in {1..20}; do
    PENDING_SERVICES=$(ssh_exec "docker service ls --format '{{.Replicas}}' | grep '0/' | wc -l")
    if [ "$PENDING_SERVICES" -eq 0 ]; then
        echo -e "${GREEN}✓ All services are running${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting for services to start... (attempt $i/60)${NC}"
    sleep 10
done


# sshpass -p "regex-33" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null 
#-o LogLevel=ERROR root@10.13.249.247 
#"sudo docker container ls --format '{{.ID}} {{.Image}}' | grep 'ft_transcendence/kibana' | 
#awk '{print \$1}' | xargs -I {} sudo docker exec {} /scripts/import_dashboards.sh"



# for i in {1..20}; do
#     PENDING_SERVICES=$(ssh_exec "docker service ls --format '{{.Replicas}}' | grep '0/' | wc -l")
#     if [ "$PENDING_SERVICES" -eq 0 ]; then
#         echo -e "${GREEN}✓ All services are running${NC}"
#         break
#     elif [ "$PENDING_SERVICES" -gt 0 ]; then
#         echo -e "${YELLOW}Updating pending services... | $i | ${NC}"
#         ssh_exec "docker service update --force $i"
#     fi
#     sleep 80
#     echo -e "${GREEN}✓ Service $i updated${NC}"
# done


# Minimal /etc/hosts update logic
declare -A hosts_entries=(
    ["$MANAGER_IP    regex-33.com traefik.regex-33.com registry-ui.regex-33.com vault.regex-33.com"]="Traefik with Application"
    ["$WORKER1_IP    logging.regex-33.com"]="Logging"
    ["$WORKER2_IP    monitoring.regex-33.com prometheus.regex-33.com alertmanager.regex-33.com"]="Monitoring"
)

for entry in "${!hosts_entries[@]}"; do
    if ! grep -q "$entry" /etc/hosts; then
        echo -e "${YELLOW}Updating /etc/hosts file for ${hosts_entries[$entry]}...${NC}"
        echo "$entry" | sudo tee -a /etc/hosts > /dev/null
        echo -e "${GREEN}✓ /etc/hosts updated successfully${NC}"
    else
        echo -e "${GREEN}✓ /etc/hosts already contains the necessary entries for ${hosts_entries[$entry]}${NC}"
    fi
done

# Final health checks
echo -e "${BLUE} Performing final health checks...${NC}"

# Check web services
echo -e "${YELLOW}Checking web services...${NC}"
services_to_check=(
    "regex-33.com|Application"
    "traefik.regex-33.com|Reverse Proxy (Traefik)"
    "registry-ui.regex-33.com|Registry UI (Docker Registry)"
    "logging.regex-33.com|Logging (Kibana)"
    "monitoring.regex-33.com|Monitoring (Grafana)"
    "prometheus.regex-33.com|Prometheus (Prometheus)"
    "alertmanager.regex-33.com|Alertmanager (Alertmanager)"
)

for service in "${services_to_check[@]}"; do
    IFS='|' read -r full_url name <<< "$service"
    echo -n -e "${YELLOW}Checking $name ($full_url)... ${NC}"
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$full_url" | grep -q "200\|401\|302"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
done

sleep 120

#check if kibana is running befor run import_dashboards.sh
if curl -k -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "https://logging.regex-33.com" | grep -q "200\|401\|302"; then
    ssh_exec_logging "sudo docker container ls --format '{{.ID}} {{.Image}}' | grep 'ft_transcendence/kibana' | awk '{print \$1}' | xargs -I {} sudo docker exec --user root  {} /scripts/import_dashboards.sh"
    echo -e "${GREEN}✓ Kibana is running, dashboards imported successfully.${NC}"
else
    echo -e "${RED}✗ Kibana is not running, skipping dashboard import.${NC}"
fi

# Check if Grafana is running before running setup-dashboards.sh
if curl -k -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "https://monitoring.regex-33.com" | grep -q "200\|401\|302"; then
    ssh_exec_monitoring "sudo docker container ls --format '{{.ID}} {{.Image}}' | grep 'ft_transcendence/grafana' | awk '{print \$1}' | xargs -I {} sudo docker exec --user root {} /usr/local/bin/setup-dashboards.sh"
    echo -e "${GREEN}✓ Grafana is running, dashboards setup successfully.${NC}"
else
    echo -e "${RED}✗ Grafana is not running, skipping dashboard setup.${NC}"
fi

# Show registry contents
echo -e "${BLUE} Registry Contents:${NC}"
ssh_exec "curl -s http://$MANAGER_IP:5000/v2/_catalog | python3 -m json.tool || curl -s http://$MANAGER_IP:5000/v2/_catalog"

# Show final status
echo -e "${BLUE}Final Deployment Status${NC}"
ssh_exec "
echo '=== Stacks ==='
docker stack ls

echo ''
echo '=== Services ==='
docker service ls

echo ''
echo '=== Registry Status ==='
curl -s http://$MANAGER_IP:5000/v2/_catalog | head -n 5

echo ''
echo '=== Node Usage ==='
docker system df
"

# Create deployment summary
echo -e "${GREEN}✓ Stack deployment with private registry completed!${NC}"
echo -e "${BLUE}Access Information:${NC}"
echo -e "  ${YELLOW}Frontend:${NC} http://$MANAGER_IP"
echo -e "  ${YELLOW}Private Registry:${NC} http://$MANAGER_IP:5000"
echo -e "  ${YELLOW}Registry UI:${NC} http://$MANAGER_IP:5002"
echo -e "  ${YELLOW}Kibana:${NC} https://$WORKER1_IP:5601"
echo -e "  ${YELLOW}Grafana:${NC} http://$WORKER2_IP:3001 (admin/admin123)"
echo -e "  ${YELLOW}Prometheus:${NC} http://$WORKER2_IP:9090"
echo -e "  ${YELLOW}Elasticsearch:${NC} http://$WORKER1_IP:9200"

# Save deployment info
ssh_exec "
cat > /opt/transcendence/deployment-info.txt << EOF
ft_transcendence Docker Swarm Deployment with Private Registry
Deployment Date: \$(date)
Manager IP: $MANAGER_IP
Worker 1 (Logging): $WORKER1_IP
Worker 2 (Monitoring): $WORKER2_IP
Private Registry: http://$MANAGER_IP:5000

Access URLs:
- Frontend: http://$MANAGER_IP
- Private Registry: http://$MANAGER_IP:5000
- Registry UI: http://$MANAGER_IP:5002
- Kibana: https://$WORKER1_IP:5601
- Grafana: http://$WORKER2_IP:3001
- Prometheus: http://$WORKER2_IP:9090
- Elasticsearch: https://$WORKER1_IP:9200

Credentials:
- Grafana: admin/admin123
- PostgreSQL: $POSTGRES_USER/$POSTGRES_PASSWORD
- Redis: Password protected with: $REDIS_PASSWORD
- Registry: admin/admin123 (for web UI)
EOF
"

echo -e "${GREEN} All stacks deployed successfully with private registry!${NC}"
