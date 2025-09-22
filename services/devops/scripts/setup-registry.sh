#!/bin/bash
# Setup Private Docker Registry Script
# File: scripts/setup-registry.sh

set -e

source .env

MANAGER_IP=$1
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

scp_copy_folder() {
    sshpass -p "$SSH_PASS" scp -r $SSH_OPTS "$1" "$SSH_USER@$MANAGER_IP:$2"
}
# Function to execute commands via SSH
ssh_exec() {
    sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$SSH_USER@$MANAGER_IP" "$1"
}

# Function to copy files via SCP
scp_copy() {
    sshpass -p "$SSH_PASS" scp $SSH_OPTS "$1" "$SSH_USER@$MANAGER_IP:$2"
}


# Create deployment directory on manager
echo -e "${YELLOW}Creating deployment directory...${NC}"
ssh_exec "rm -rf /opt/transcendence/deploy && mkdir -p /opt/transcendence/deploy"

# Copy application files to manager
echo -e "${YELLOW}Copying application files...${NC}"
scp_copy_folder "./" "/opt/transcendence/deploy/"

echo -e "${BLUE} Setting up Private Docker Registry${NC}"

# Create registry configuration on manager node
echo -e "${YELLOW}Creating registry configuration...${NC}"

# Create Docker registry config on manager
ssh_exec "
# Create registry config as Docker config
docker config rm registry-config-file 2>/dev/null || true
docker config create registry-config-file /opt/transcendence/deploy/services/devops/registry/configs/registry.yml
"

# Deploy registry stack
echo -e "${YELLOW}Deploying registry stack...${NC}"
ssh_exec "cd /opt/transcendence/deploy && source .env && docker stack deploy -c stacks/docker-compose.registry.yml ft-registry"

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
echo -e "  ${YELLOW}Registry UI:${NC} http://$MANAGER_IP:5002 or https://registry-ui.ft-transcendence.com"
echo -e "  ${YELLOW}Registry API:${NC} https://registry.ft-transcendence.com (admin/admin123)"
