#!/bin/bash

echo "🚨 WARNING: This will delete ALL containers, volumes, and networks!"
read -p "Are you sure you want to continue? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
  echo "❌ Cancelled."
  exit 1
fi

echo "🧹 Stopping all running containers..."
docker stop $(docker ps -q)

echo "🗑️ Removing all containers..."
docker rm $(docker ps -a -q)

echo "🧯 Removing all volumes..."
docker volume rm $(docker volume ls -q)

echo "🔌 Removing all unused networks..."
docker network prune -f

# Optional: Remove all images
echo "🖼️ Removing all images..."
docker rmi $(docker images -q)

echo "✅ Done. Docker is cleaned."

