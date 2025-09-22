#!/bin/bash
# Script to prepare Docker Swarm nodes
# Usage: ./prepare-nodes.sh <IP> <node_type>

set -e

# Load environment variables
source .env
echo "SSH_PASS=$SSH_PASS"
echo "SSH_USER=$SSH_USER"

IP=$1
NODE_TYPE=$2
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Preparing node: $IP (Type: $NODE_TYPE)${NC}"

color_cmd() {
    while IFS= read -r line; do
        echo -e "${GREEN}${line}${NC}"
    done
}


# Function to execute commands via SSH
ssh_exec() {
    sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$SSH_USER@$IP" "$1"
}

# Function to copy files via SCP
scp_copy() {
    sshpass -p "$SSH_PASS" scp $SSH_OPTS "$1" "$SSH_USER@$IP:$2"
}

# Test connection
echo -e "${YELLOW}Testing connection to $IP...${NC}"
if ! ssh_exec "echo 'Connection successful'"; then
    echo -e "${RED}✗ Cannot connect to $IP${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Connection successful${NC}"

# # Update system
echo -e "${YELLOW}Updating system packages...${NC}"
ssh_exec '
# Wait for any dpkg locks
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    echo "⏳ Waiting for other package managers to finish..."
    sleep 5
done

# Fix broken installs if needed
# apt-get autoremove -y > /dev/null || true
dpkg --configure -a || true
apt-get install -f -y || true

# Update & upgrade safely
apt-get autoremove -y > /dev/null || true
apt-get update -y > /dev/null
apt-get upgrade -y > /dev/null || true
'

echo -e "${YELLOW}Installing required packages...${NC}"
ssh_exec '
# Wait for any dpkg locks
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    echo "⏳ Waiting for other package managers to finish..."
    sleep 5
done

# Fix broken installs if needed
dpkg --configure -a || true
apt-get install -f -y || true

# Update & upgrade safely
apt-get update -y > /dev/null
apt-get upgrade -y > /dev/null || true
apt-get install -y curl wget apt-transport-https ca-certificates gnupg lsb-release software-properties-common > /dev/null
echo -e "${YELLOW}Installing monitoring tools...${NC}"
apt-get install -y htop iotop nethogs ncdu tree jq > /dev/null
'

# Install Docker if not installed
echo -e "${YELLOW}Installing Docker...${NC}"
ssh_exec "
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y docker.io
    sudo apt-get install -y docker-compose
    sudo apt-get install -y python3-pip # For docker-compose because it's a python package so it's needs some libraries
    sudo systemctl start docker
    sudo systemctl enable docker

    # Update package index
    apt-get update
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    echo '✓ Docker installed successfully'
else
    echo '✓ Docker already installed'
fi
"

# Configure Docker daemon
echo -e "${YELLOW}Configuring Docker daemon... for insecure registry...${NC}"
ssh_exec "
# Create Docker daemon configuration
mkdir -p /etc/docker
# Check if daemon.json exists and backup
if [ -f /etc/docker/daemon.json ]; then
    cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
fi
cat > /etc/docker/daemon.json << EOF
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

# Restart Docker
sudo systemctl daemon-reload
sudo systemctl restart docker

"

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ssh_exec "
# Install UFW if not present
apt-get install -y ufw > /dev/null

# Configure UFW
echo -e \"${GREEN}Configuring UFW...${NC}\"
{
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh

    # Docker Swarm ports
    ufw allow 2376/tcp  # Docker daemon (TLS)
    ufw allow 2377/tcp  # Swarm management
    ufw allow 7946/tcp  # Container network discovery
    ufw allow 7946/udp  # Container network discovery
    ufw allow 4789/udp  # Overlay network

    # Application specific ports based on node type
    echo "${NC}"
    case '$NODE_TYPE' in
        'manager')
            ufw allow 80/tcp     # HTTP
            ufw allow 443/tcp    # HTTPS
            ufw allow 5432/tcp   # PostgreSQL
            ufw allow 6379/tcp   # Redis
            ;;
        'logging')
            ufw allow 5601/tcp   # Kibana
            ufw allow 9200/tcp   # Elasticsearch
            ufw allow 5044/tcp   # Logstash
            ;;
        'monitoring')
            ufw allow 3001/tcp   # Grafana
            ufw allow 9090/tcp   # Prometheus
            ;;
    esac

    # Enable firewall
    ufw --force enable
} 2>&1 | while IFS= read -r line; do echo -e \"${GREEN}\${line}${NC}\"; done

echo -e \"${GREEN}Firewall configuration done.${NC}\"
"


echo -e "${YELLOW}Configuring system limits...${NC}"
ssh_exec "
# Load br_netfilter if missing
modprobe br_netfilter || true

# Ensure it's loaded on boot
cat > /etc/modules-load.d/br_netfilter.conf << EOF
br_netfilter
EOF

# Configure limits for containers
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

# Configure sysctl for Docker Swarm and Elasticsearch
cat > /etc/sysctl.d/99-transcendence.conf << EOF
# Docker Swarm optimizations
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1

# Elasticsearch optimizations
vm.max_map_count = 262144
vm.swappiness = 1

# Network optimizations
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 8192
EOF

# Apply sysctl settings
sysctl --system
"

# Configure log rotation
echo -e "${YELLOW}Configuring log rotation...${NC}"
ssh_exec "
cat > /etc/logrotate.d/transcendence << EOF
/var/log/transcendence/*/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    copytruncate
    notifempty
    create 0644 root root
}
EOF
"

# Set timezone
echo -e "${YELLOW}Setting timezone...${NC}"
ssh_exec "
timedatectl set-timezone UTC
"

echo -e "${GREEN}✓ Node $IP ($NODE_TYPE) prepared successfully${NC}"

# Verify installation
echo -e "${YELLOW}Verifying installation...${NC}"
ssh_exec "
echo 'Docker version:'
docker --version

echo 'Docker Compose version:'
docker-compose --version
"

echo -e "${GREEN}✓ Node preparation completed for $IP${NC}"
