#!/bin/bash
set -e

echo "🧹 Stopping all running containers..."
docker ps -q | xargs -r docker stop

echo "🗑 Removing all containers..."
docker ps -aq | xargs -r docker rm

echo "🧯 Removing all volumes..."
docker volume ls -q | xargs -r docker volume rm

echo "🔌 Removing all unused networks..."
docker network prune -f

echo "🖼️ Removing all images..."
docker images -q | xargs -r docker rmi -f

echo "Done. Docker is cleaned."

