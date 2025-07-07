#!/bin/bash

echo "Performing health checks..."

services=(
    "frontend:3000"
    "api-gateway:3001"
    "auth-service:3002"
    "user-service:3003"
    "game-service:3004"
    "chat-service:3005"
    "tournament-service:3006"
    "match-service:3007"
    "notification-service:3008"
    "file-service:3009"
    "stats-service:3010"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -f -s "http://localhost:$port/health" > /dev/null; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is unhealthy"
    fi
done

# Check databases
if docker-compose exec -T postgres pg_isready > /dev/null 2>&1; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL is unhealthy"
fi

if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is unhealthy"
fi

# Check monitoring services
if curl -f -s "http://localhost:9090/-/healthy" > /dev/null; then
    echo "✅ Prometheus is healthy"
else
    echo "❌ Prometheus is unhealthy"
fi

if curl -f -s "http://localhost:3003/api/health" > /dev/null; then
    echo "✅ Grafana is healthy"
else
    echo "❌ Grafana is unhealthy"
fi