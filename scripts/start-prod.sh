#!/bin/bash

echo "Starting ft_transcendence production environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create it from .env.example"
    exit 1
fi

# Build and start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 30

# Run migrations
echo "Running database migrations..."
make db-migrate

echo "Production environment is ready!"
echo "Application: https://your-domain.com"