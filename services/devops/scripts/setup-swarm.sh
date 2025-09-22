#!/bin/bash
# Docker Swarm Setup Script
# Usage: ./setup-swarm.sh <action> <manager_ip> [worker1_ip] [worker2_ip]

set -e

source .env

ACTION=$1
MANAGER_IP=$2
WORKER1_IP=$3
WORKER2_IP=$4

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to execute commands via SSH
ssh_exec() {
    sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$SSH_USER@$1" "${@:2}"
}

# Function to copy files via SCP
scp_copy() {
    sshpass -p "$SSH_PASS" scp $SSH_OPTS "$1" "$SSH_USER@$2:$3"
}

case $ACTION in
    "init")
        echo -e "${BLUE} Initializing Docker Swarm on $MANAGER_IP${NC}"
        
        # Initialize swarm
        echo -e "${YELLOW}Initializing swarm...${NC}"
        INIT_OUTPUT=$(ssh_exec $MANAGER_IP "docker swarm init --advertise-addr $MANAGER_IP --listen-addr $MANAGER_IP:2377")
        
        # Extract join tokens
        WORKER_TOKEN=$(ssh_exec $MANAGER_IP "docker swarm join-token worker -q")
        MANAGER_TOKEN=$(ssh_exec $MANAGER_IP "docker swarm join-token manager -q")
        
        # Save tokens to temporary files
        echo "$WORKER_TOKEN" > /tmp/worker-token
        echo "$MANAGER_TOKEN" > /tmp/manager-token
        echo "$MANAGER_IP" > /tmp/manager-ip
        
        echo -e "${GREEN}✓ Swarm initialized successfully${NC}"
        echo -e "${YELLOW}Worker token saved to /tmp/worker-token${NC}"
        ;;
        
    "join")
        echo -e "${BLUE} Joining worker nodes to swarm${NC}"
        
        # Check if tokens exist
        if [ ! -f /tmp/worker-token ] || [ ! -f /tmp/manager-ip ]; then
            echo -e "${RED}✗ Swarm tokens not found. Please run 'init' first.${NC}"
            exit 1
        fi
        
        WORKER_TOKEN=$(cat /tmp/worker-token)
        SAVED_MANAGER_IP=$(cat /tmp/manager-ip)
        
        # Join worker node 1 (Logging)
        if [ -n "$WORKER1_IP" ]; then
            echo -e "${YELLOW}Joining worker node 1 (Logging): $WORKER1_IP${NC}"
            ssh_exec $WORKER1_IP "docker swarm join --token $WORKER_TOKEN $SAVED_MANAGER_IP:2377"
        fi
        
        # Join worker node 2 (Monitoring)
        if [ -n "$WORKER2_IP" ]; then
            echo -e "${YELLOW}Joining worker node 2 (Monitoring): $WORKER2_IP${NC}"
            ssh_exec $WORKER2_IP "docker swarm join --token $WORKER_TOKEN $SAVED_MANAGER_IP:2377"
        fi
        
        echo -e "${GREEN}✓ All worker nodes joined successfully${NC}"
        ;;
        
    "configure")
        echo -e "${BLUE} Configuring swarm cluster${NC}"
        
        # Get node information with better parsing
        echo -e "${YELLOW}Getting node information...${NC}"
        
        # Get all nodes with their details
        NODE_INFO=$(ssh_exec $MANAGER_IP "docker node ls --format 'table {{.ID}}\t{{.Hostname}}\t{{.Status}}\t{{.Availability}}\t{{.ManagerStatus}}'")
        echo "Current nodes:"
        echo "$NODE_INFO"
        
        # Get manager node
        MANAGER_NODE_ID=$(ssh_exec $MANAGER_IP "docker node ls --filter role=manager --format '{{.ID}}'")
        echo -e "${BLUE}Manager node ID: $MANAGER_NODE_ID${NC}"
        
        # Get worker nodes with their hostnames
        WORKER_NODES_RAW=$(ssh_exec $MANAGER_IP "docker node ls --filter role=worker --format '{{.ID}} {{.Hostname}}'")
        
        LOGGING_NODE_ID=""
        MONITORING_NODE_ID=""
        
        echo -e "${YELLOW}Processing worker nodes...${NC}"
        if [ -n "$WORKER_NODES_RAW" ]; then
            while IFS= read -r line; do
                if [ -z "$line" ]; then
                    continue
                fi
                
                NODE_ID=$(echo "$line" | awk '{print $1}')
                NODE_HOSTNAME=$(echo "$line" | awk '{print $2}')
                
                echo "Processing node: $NODE_ID ($NODE_HOSTNAME)"
                
                # Check hostname patterns to identify node types
                case "$NODE_HOSTNAME" in
                    *logging*)
                        LOGGING_NODE_ID=$NODE_ID
                        echo -e "${GREEN}✓ Identified logging node: $NODE_ID ($NODE_HOSTNAME)${NC}"
                        ;;
                    *monitoring*)
                        MONITORING_NODE_ID=$NODE_ID
                        echo -e "${GREEN}✓ Identified monitoring node: $NODE_ID ($NODE_HOSTNAME)${NC}"
                        ;;
                    *)
                        # If we can't identify by hostname, check if we only have one worker node
                        if [ -z "$LOGGING_NODE_ID" ] && [ -z "$WORKER2_IP" ]; then
                            LOGGING_NODE_ID=$NODE_ID
                            echo -e "${GREEN}✓ Assigned as logging node (single worker): $NODE_ID ($NODE_HOSTNAME)${NC}"
                        elif [ -z "$MONITORING_NODE_ID" ] && [ -n "$WORKER2_IP" ]; then
                            MONITORING_NODE_ID=$NODE_ID
                            echo -e "${GREEN}✓ Assigned as monitoring node: $NODE_ID ($NODE_HOSTNAME)${NC}"
                        fi
                        ;;
                esac
            done <<< "$WORKER_NODES_RAW"
        fi
        
        # Label nodes with error checking
        echo -e "${YELLOW}Labeling nodes...${NC}"
        
        # Label manager node
        if [ -n "$MANAGER_NODE_ID" ]; then
            echo "Labeling manager node ($MANAGER_NODE_ID) as 'application'..."
            ssh_exec $MANAGER_IP "docker node update --label-add type=application $MANAGER_NODE_ID"
            echo -e "${GREEN}✓ Manager node labeled successfully${NC}"
        else
            echo -e "${RED}✗ Manager node ID not found!${NC}"
            exit 1
        fi
        
        # Label logging node
        if [ -n "$LOGGING_NODE_ID" ]; then
            echo "Labeling logging node ($LOGGING_NODE_ID) as 'logging'..."
            ssh_exec $MANAGER_IP "docker node update --label-add type=logging $LOGGING_NODE_ID"
            echo -e "${GREEN}✓ Logging node labeled successfully${NC}"
        else
            echo -e "${YELLOW} No logging node identified${NC}"
        fi
        
        # Label monitoring node
        if [ -n "$MONITORING_NODE_ID" ]; then
            echo "Labeling monitoring node ($MONITORING_NODE_ID) as 'monitoring'..."
            ssh_exec $MANAGER_IP "docker node update --label-add type=monitoring $MONITORING_NODE_ID"
            echo -e "${GREEN}✓ Monitoring node labeled successfully${NC}"
        else
            echo -e "${YELLOW} No monitoring node identified${NC}"
        fi
        
        # Verify labels were applied
        echo -e "${YELLOW}Verifying node labels...${NC}"
        ssh_exec $MANAGER_IP "
            echo 'Node labels verification:'
            for node in \$(docker node ls --format '{{.ID}}'); do
                hostname=\$(docker node inspect \$node --format '{{.Description.Hostname}}')
                role=\$(docker node inspect \$node --format '{{.Spec.Role}}')
                labels=\$(docker node inspect \$node --format '{{range \$k, \$v := .Spec.Labels}}{{\$k}}={{\$v}} {{end}}')
                echo \"  \$hostname (\$role): \$labels\"
            done
        "
        
        # Create overlay networks
        echo -e "${YELLOW}Creating overlay networks...${NC}"
        ssh_exec $MANAGER_IP "
            docker network create --driver overlay --attachable vault-network || echo 'vault-network already exists'
            docker network create --driver overlay --attachable traefik-public || echo 'traefik-public already exists'
            docker network create --driver overlay --attachable logging-network || echo 'logging-network already exists'
            docker network create --driver overlay --attachable app-network || echo 'app-network already exists'
            docker network create --driver overlay --attachable monitoring-network || echo 'monitoring-network already exists'
            docker network create --driver overlay --attachable registry-network || echo 'registry-network already exists'
        "
        
        # Create configs (if files exist)
        echo -e "${YELLOW}Creating Docker configs...${NC}"
        if [ -f "services/devops/logging/filebeat/config/filebeat.manager.yml" ]; then
            scp_copy "services/devops/logging/filebeat/config/filebeat.manager.yml" $MANAGER_IP "/tmp/filebeat.manager.yml"
            ssh_exec $MANAGER_IP "
                docker config rm filebeat-manager-config 2>/dev/null || true
                docker config create filebeat-manager-config /tmp/filebeat.manager.yml
                rm /tmp/filebeat.manager.yml
            "
        fi

        if [ -f "services/devops/logging/filebeat/config/filebeat.worker.yml" ]; then
            scp_copy "services/devops/logging/filebeat/config/filebeat.worker.yml" $MANAGER_IP "/tmp/filebeat.worker.yml"
            ssh_exec $MANAGER_IP "
                docker config rm filebeat-worker-config 2>/dev/null || true
                docker config create filebeat-worker-config /tmp/filebeat.worker.yml
                rm /tmp/filebeat.worker.yml
            "
        fi
        
        # Show cluster status
        echo -e "${YELLOW}Final cluster status:${NC}"
        ssh_exec $MANAGER_IP "docker node ls"
        
        echo -e "${GREEN}✓ Swarm cluster configured successfully${NC}"
        ;;
        
    "status")
        echo -e "${BLUE} Swarm Status${NC}"
        ssh_exec $MANAGER_IP "
            echo '=== Nodes ==='
            docker node ls
            echo ''
            echo '=== Node Labels ==='
            for node in \$(docker node ls --format '{{.ID}}'); do
                hostname=\$(docker node inspect \$node --format '{{.Description.Hostname}}')
                role=\$(docker node inspect \$node --format '{{.Spec.Role}}')
                labels=\$(docker node inspect \$node --format '{{range \$k, \$v := .Spec.Labels}}{{\$k}}={{\$v}} {{end}}')
                echo \"  \$hostname (\$role): \$labels\"
            done
            echo ''
            echo '=== Networks ==='
            docker network ls --filter driver=overlay
            echo ''
            echo '=== Configs ==='
            docker config ls
            echo ''
            echo '=== Secrets ==='
            docker secret ls
        "
        ;;
        
    *)
        echo -e "${RED}✗ Invalid action: $ACTION${NC}"
        echo -e "${YELLOW}Usage: $0 <init|join|configure|status> <manager_ip> [worker1_ip] [worker2_ip]${NC}"
        exit 1
        ;;
esac