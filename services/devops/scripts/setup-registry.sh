#!/bin/bash
# Setup Private Docker Registry Script
# File: scripts/setup-registry.sh

set -e

source .env

MANAGER_IP=$1
SSH_USER=root
SSH_PASS=regex-33
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"

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

# Function to copy files via SCP
scp_copy() {
    sshpass -p "$SSH_PASS" scp $SSH_OPTS "$1" "$SSH_USER@$MANAGER_IP:$2"
}

echo -e "${BLUE} Setting up Private Docker Registry${NC}"

# Create registry configuration on manager node
echo -e "${YELLOW}Creating registry configuration...${NC}"
ssh_exec "mkdir -p /opt/registry/config"

# Copy registry configuration to manager
scp_copy "./services/devops/registry/configs/registry.yml" "/opt/registry/config/registry.yml"

# Create Docker registry config on manager
ssh_exec "
# Create registry config as Docker config
docker config rm registry-config-file 2>/dev/null || true
docker config create registry-config-file /opt/registry/config/registry.yml
"

# Deploy registry stack
echo -e "${YELLOW}Deploying registry stack...${NC}"
scp_copy "stacks/docker-compose.registry.yml" "/opt/transcendence/"
ssh_exec "cd /opt/transcendence && docker stack deploy -c docker-compose.registry.yml ft-registry"

# Wait for registry to be ready
echo -e "${YELLOW}Waiting for registry to be ready...${NC}"
for i in {1..30}; do
    if ssh_exec "curl -s http://$MANAGER_IP:5000/v2/ | grep -q '{}'"; then
        echo -e "${GREEN}✓ Registry is ready${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting for registry... (attempt $i/30)${NC}"
    sleep 5
done

# Configure all nodes to use insecure registry
echo -e "${YELLOW}Configuring all nodes for insecure registry...${NC}"

NODES=("$MANAGER_IP" "$WORKER1_IP" "$WORKER2_IP")
for node in "${NODES[@]}"; do
    if [ -n "$node" ]; then
        echo -e "${YELLOW}Configuring node: $node${NC}"
        sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$SSH_USER@$node" "
            # Configure Docker daemon for insecure registry
            mkdir -p /etc/docker
            
            # Check if daemon.json exists and backup
            if [ -f /etc/docker/daemon.json ]; then
                cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
            fi
            
            # Create or update daemon.json to include insecure registry
            cat > /etc/docker/daemon.json << 'EOF'
{
    \"log-driver\": \"json-file\",
    \"log-opts\": {
        \"max-size\": \"10m\",
        \"max-file\": \"3\"
    },
    \"storage-driver\": \"overlay2\",
    \"metrics-addr\": \"0.0.0.0:9323\",
    \"experimental\": false,
    \"insecure-registries\": [\"$MANAGER_IP:5000\", \"registry:5000\", \"localhost:5000\"]
}
EOF
            
            # Restart Docker daemon
            systemctl daemon-reload
            systemctl restart docker
            
            # Wait for Docker to be ready
            sleep 10
            
            # Test connection to registry
            timeout 30 sh -c 'until curl -s http://$MANAGER_IP:5000/v2/ > /dev/null; do sleep 1; done' || true
        "
        echo -e "${GREEN}✓ Node $node configured${NC}"
    fi
done

# Test registry connectivity from all nodes
echo -e "${YELLOW}Testing registry connectivity...${NC}"
for node in "${NODES[@]}"; do
    if [ -n "$node" ]; then
        echo -n -e "${YELLOW}Testing from $node: ${NC}"
        if sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$SSH_USER@$node" "curl -s http://$MANAGER_IP:5000/v2/ | grep -q '{}'"; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi
    fi
done

echo -e "${GREEN}✓ Private Docker Registry setup completed!${NC}"
echo -e "${BLUE}Registry Information:${NC}"
echo -e "  ${YELLOW}Registry URL:${NC} http://$MANAGER_IP:5000"
echo -e "  ${YELLOW}Registry UI:${NC} http://$MANAGER_IP:5002 or https://registry-ui.regex-33.com"
echo -e "  ${YELLOW}Registry API:${NC} https://registry.regex-33.com (admin/admin123)"
