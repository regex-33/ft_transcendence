# ft_transcendence Makefile

.PHONY: help build up down logs clean test lint format install dev prod

# Default target
help:
	@echo "Available commands:"
	@echo "  build     - Build all services"
	@echo "  up        - Start all services"
	@echo "  down      - Stop all services"
	@echo "  dev       - Start development environment"
	@echo "  prod      - Start production environment"
	@echo "  logs      - Show logs from all services"
	@echo "  test      - Run tests for all services"
	@echo "  clean     - Clean up containers and volumes"
	@echo "  lint      - Run linting for all services"
	@echo "  format    - Format code for all services"
	@echo "  install   - Install dependencies for all services"

# Build all services
build:
	docker-compose build --no-cache

# Development environment
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "Frontend: http://localhost:3000"
	@echo "API Gateway: http://localhost:3001"
	@echo "Grafana: http://localhost:3003"
	@echo "Prometheus: http://localhost:9090"
	@echo "Kibana: http://localhost:5601"
	@echo "RabbitMQ Management: http://localhost:15672"

# Production environment
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "Production environment started!"

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Show logs
logs:
	docker-compose logs -f

# Run tests
test:
	@echo "Running tests for all services..."
	docker-compose exec frontend npm run test
	docker-compose exec api-gateway npm run test
	docker-compose exec auth-service npm run test
	docker-compose exec user-service npm run test
	docker-compose exec game-service npm run test
	docker-compose exec chat-service npm run test
	docker-compose exec tournament-service npm run test
	docker-compose exec match-service npm run test
	docker-compose exec notification-service npm run test
	docker-compose exec file-service npm run test
	docker-compose exec stats-service npm run test

# Clean up
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

# Lint all services
lint:
	@echo "Linting all services..."
	docker-compose exec frontend npm run lint
	docker-compose exec api-gateway npm run lint
	docker-compose exec auth-service npm run lint
	docker-compose exec user-service npm run lint
	docker-compose exec game-service npm run lint
	docker-compose exec chat-service npm run lint
	docker-compose exec tournament-service npm run lint
	docker-compose exec match-service npm run lint
	docker-compose exec notification-service npm run lint
	docker-compose exec file-service npm run lint
	docker-compose exec stats-service npm run lint

# Format code
format:
	@echo "Formatting code for all services..."
	docker-compose exec frontend npm run format
	docker-compose exec api-gateway npm run format
	docker-compose exec auth-service npm run format
	docker-compose exec user-service npm run format
	docker-compose exec game-service npm run format
	docker-compose exec chat-service npm run format
	docker-compose exec tournament-service npm run format
	docker-compose exec match-service npm run format
	docker-compose exec notification-service npm run format
	docker-compose exec file-service npm run format
	docker-compose exec stats-service npm run format

# Install dependencies
install:
	@echo "Installing dependencies for all services..."
	cd services/frontend && npm install
	cd services/api-gateway && npm install
	cd services/auth-service && npm install
	cd services/user-service && npm install
	cd services/game-service && npm install
	cd services/chat-service && npm install
	cd services/tournament-service && npm install
	cd services/match-service && npm install
	cd services/notification-service && npm install
	cd services/file-service && npm install
	cd services/stats-service && npm install

# Database operations
db-migrate:
	docker-compose exec auth-service npm run migrate
	docker-compose exec user-service npm run migrate
	docker-compose exec game-service npm run migrate
	docker-compose exec chat-service npm run migrate
	docker-compose exec tournament-service npm run migrate
	docker-compose exec match-service npm run migrate
	docker-compose exec file-service npm run migrate
	docker-compose exec stats-service npm run migrate

db-seed:
	docker-compose exec auth-service npm run seed
	docker-compose exec user-service npm run seed
	docker-compose exec game-service npm run seed
	docker-compose exec chat-service npm run seed
	docker-compose exec tournament-service npm run seed
	docker-compose exec match-service npm run seed
	docker-compose exec file-service npm run seed
	docker-compose exec stats-service npm run seed

# Monitoring
monitoring-up:
	docker-compose -f services/devops/monitoring/docker-compose.monitoring.yml up -d

logging-up:
	docker-compose -f services/devops/logging/docker-compose.elk.yml up -d

# Health check
health:
	@echo "Checking service health..."
	./scripts/health-check.sh

# Backup
backup:
	./scripts/backup.sh

# Restore
restore:
	./scripts/restore.sh $(BACKUP_FILE)