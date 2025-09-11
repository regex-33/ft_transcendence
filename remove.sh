#!/bin/bash


echo "🧹 Stopping all running containers..."
docker stop $(docker ps -q)

echo "🗑️ Removing all containers..."
docker rm $(docker ps -a -q)

echo "🧯 Removing all volumes..."
docker volume rm $(docker volume ls -q)

echo "🔌 Removing all unused networks..."
docker network prune -f
docker builder prune --all -force
# Optional: Remove all images
echo "🖼️ Removing all images..."
docker rmi $(docker images -q)

echo "✅ Done. Docker is cleaned."

