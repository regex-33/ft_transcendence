#!/bin/bash

set -euo pipefail

# Detect operating system
detect_os() {
    if [ -f /etc/debian_version ]; then
        echo "debian"
    elif [ -f /etc/redhat-release ]; then
        echo "redhat"
    else
        echo "unsupported"
    fi
}

OS=$(detect_os)

if [[ "$OS" == "unsupported" ]]; then
    echo "✗ Unsupported operating system."
    exit 1
fi

echo "✓ Detected OS: $OS"

# Update system
echo " Updating system..."
if [[ "$OS" == "debian" ]]; then
    apt-get update -y
    apt-get upgrade -y
elif [[ "$OS" == "redhat" ]]; then
    yum update -y
fi

# Install dependencies
echo " Installing required packages..."
if [[ "$OS" == "debian" ]]; then
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release > /dev/null
elif [[ "$OS" == "redhat" ]]; then
    yum install -y \
        yum-utils \
        device-mapper-persistent-data \
        lvm2 > /dev/null
fi

# Setup Docker repository
echo " Setting up Docker repository..."
# if [[ "$OS" == "debian" ]]; then
#     install -m 0755 -d /etc/apt/keyrings
#     curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
#     chmod a+r /etc/apt/keyrings/docker.gpg
#
#     echo \
#       "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
#       https://download.docker.com/linux/debian \
#       $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
#
#     apt-get update -y
#
# elif [[ "$OS" == "redhat" ]]; then
#     yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
# fi

# Install Docker Engine
echo " Installing Docker Engine..."
if [[ "$OS" == "debian" ]]; then
    apt-get install -y \
        docker.io \
        docker-compose \
        docker-ce \
        docker-ce-cli \
        containerd.io \
        docker-buildx-plugin \
        docker-compose-plugin

elif [[ "$OS" == "redhat" ]]; then
    yum install -y \
        docker-ce \
        docker-ce-cli \
        containerd.io \
        docker-buildx-plugin \
        docker-compose-plugin
fi

# Enable and start Docker
echo " Enabling and starting Docker..."
systemctl enable docker
systemctl start docker

echo "✓ Docker installation completed successfully!"
docker --version
docker compose version

