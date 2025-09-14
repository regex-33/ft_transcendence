#!/bin/bash
set -e

echo " Stopping all containers..."
docker ps -aq | xargs -r docker stop

echo "Removing all containers..."
docker ps -aq | xargs -r docker rm -f

echo "🖼 Removing all images..."
docker images -aq | xargs -r docker rmi -f

echo " Removing all volumes..."
docker volume ls -q | xargs -r docker volume rm -f

docker secret rm app-role-id app-secret-id logging-role-id logging-secret-id monitoring-role-id monitoring-secret-id || true

docker volume rm $(docker volume ls -q | grep vault) || true

echo "✓ Cleanup complete!"
