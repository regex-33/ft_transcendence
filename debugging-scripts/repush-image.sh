#!/bin/bash
# Rebuild and Push Image to Private Registry
# File: scripts/rebuild-image.sh

set -e

if [ $# -lt 3 ]; then
    echo "Usage: $0 <MANAGER_IP> <dir of build> <IMAGE_NAME>"
    echo "Example: $0 192.168.1.100 services/devops/vault ft_transcendence/frontend"
    exit 1
fi

MANAGER_IP=$1
IMAGE=$3
dir=$2
REGISTRY_URL="$MANAGER_IP:5000"
REGISTRY_IMAGE="$REGISTRY_URL/$IMAGE"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE} Rebuilding and pushing $IMAGE to $REGISTRY_URL${NC}"

# 1. Remove local image if exists
if docker image inspect "$IMAGE" >/dev/null 2>&1; then
    echo -e "${YELLOW}Removing local image: $IMAGE${NC}"
    docker rmi -f "$IMAGE"
fi

if docker image inspect "$REGISTRY_IMAGE" >/dev/null 2>&1; then
    echo -e "${YELLOW}Removing local registry-tagged image: $REGISTRY_IMAGE${NC}"
    docker rmi -f "$REGISTRY_IMAGE"
fi

# 2. Delete from registry (using registry API)
echo -e "${YELLOW}Deleting old image from registry: $REGISTRY_IMAGE${NC}"
# Registry requires digest, so we list and delete
DIGEST=$(curl -s -I "http://$REGISTRY_URL/v2/$IMAGE/manifests/latest" \
  -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
  | grep Docker-Content-Digest | awk '{print $2}' | tr -d $'\r')

if [ -n "$DIGEST" ]; then
    curl -s -X DELETE "http://$REGISTRY_URL/v2/$IMAGE/manifests/$DIGEST" || true
else
    echo -e "${YELLOW}⚠ No previous digest found for $IMAGE in registry${NC}"
fi

# 3. Build image
echo -e "${BLUE}⚒ Building image: $IMAGE${NC}"
docker build -t "$IMAGE" "$dir"

# 4. Tag and push
docker tag "$IMAGE" "$REGISTRY_IMAGE"
echo -e "${BLUE}Pushing: $REGISTRY_IMAGE${NC}"
docker push "$REGISTRY_IMAGE"

echo -e "${GREEN}✓ Done! Image $IMAGE rebuilt and pushed to $REGISTRY_URL${NC}"

