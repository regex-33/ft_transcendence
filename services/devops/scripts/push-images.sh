#!/bin/bash
# Push Images to Private Registry Script
# File: scripts/push-images.sh

set -e

source .env

MANAGER_IP=$1
REGISTRY_URL="$MANAGER_IP:5000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE} Pushing Docker images to private registry${NC}"

# Define all images to push
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
    "ft_transcendence/redis-exporter"
    "ft_transcendence/postgres-exporter"
    "ft_transcendence/elasticsearch-exporter"
)

# Test registry connectivity
echo -e "${YELLOW}Testing registry connectivity...${NC}"
if ! curl -s "http://$REGISTRY_URL/v2/" > /dev/null; then
    echo -e "${RED}✗ Cannot connect to registry at $REGISTRY_URL${NC}"
    echo -e "${YELLOW}Make sure the registry is running with: make setup-registry${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Registry is accessible${NC}"

    

# Function to tag and push image
push_image() {
    local image=$1
    local registry_tag="$REGISTRY_URL/$image"
    
    echo -e "${YELLOW}Processing $image...${NC}"
    
    # Check if local image exists
    if ! docker image inspect "$image" > /dev/null 2>&1; then
        echo -e "${RED}✗ Local image $image not found. Please build it first.${NC}"
        return 1
    fi
    
    # Tag image for registry
    echo -e "${BLUE}  Tagging: $image -> $registry_tag${NC}"
    docker tag "$image" "$registry_tag"
    
    # Push to registry
    echo -e "${BLUE}  Pushing: $registry_tag${NC}"
    if docker push "$registry_tag"; then
        echo -e "${GREEN}  ✓ Successfully pushed: $registry_tag${NC}"
    else
        echo -e "${RED}  ✗ Failed to push: $registry_tag${NC}"
        return 1
    fi
    
    # Clean up local registry tag
    docker rmi "$registry_tag" > /dev/null 2>&1 || true
    
    echo ""
}

# Push all images
FAILED_IMAGES=()
SUCCESSFUL_IMAGES=()

for image in "${IMAGES[@]}"; do
    if push_image "$image"; then
        SUCCESSFUL_IMAGES+=("$image")
    else
        FAILED_IMAGES+=("$image")
    fi
done

# Summary
echo -e "${BLUE} Push Summary:${NC}"
echo -e "${GREEN}✓ Successfully pushed (${#SUCCESSFUL_IMAGES[@]}):${NC}"
for image in "${SUCCESSFUL_IMAGES[@]}"; do
    echo -e "  - $image"
done

if [ ${#FAILED_IMAGES[@]} -gt 0 ]; then
    echo -e "${RED}✗ Failed to push (${#FAILED_IMAGES[@]}):${NC}"
    for image in "${FAILED_IMAGES[@]}"; do
        echo -e "  - $image"
    done
    exit 1
fi

# List images in registry
echo -e "${YELLOW}Images in registry:${NC}"
curl -s "http://$REGISTRY_URL/v2/_catalog" | grep -o '"repositories":\[[^]]*\]' | sed 's/"repositories":\[//;s/\]//;s/"//g' | tr ',' '\n' | sed 's/^/  - /'

echo -e "${GREEN} All images pushed successfully to $REGISTRY_URL!${NC}"
