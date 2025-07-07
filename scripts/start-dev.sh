#!/bin/bash

echo "Starting ft_transcendence development environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi

# Build and start services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 30

# Run migrations
echo "Running database migrations..."
make db-migrate

# Run seeds (optional)
echo "Seeding databases..."
make db-seed

echo "Development environment is ready!"
echo "Frontend: http://localhost:3000"
echo "API Gateway: http://localhost:3001"
echo "Grafana: http://localhost:3003"
echo "Prometheus: http://localhost:9090"
echo "Kibana: http://localhost:5601"
echo "RabbitMQ Management: http://localhost:15672"