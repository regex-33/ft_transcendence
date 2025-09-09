include .env
export

all: test-up

test-up:
	@echo "Starting test environment..."
	docker compose -f docker-compose.yml --profile dev up -d
	@echo "Services should be running on:"
	@echo "  - Frontend: http://localhost:${FRONTEND_PORT}"
	@echo "  - Nginx Proxy: http://localhost:${NGINX_PORT}"
	@echo "  - User Service: http://localhost:${USER_SERVICE_PORT}"
	@echo "  - PostgreSQL: localhost:${POSTGRES_PORT}"
	@echo "  - Redis: localhost:${REDIS_PORT}"

test-down:
	@echo "Stopping test environment..."
	docker compose -f docker-compose.yml --profile dev down

test-logs:
	docker compose -f docker-compose.yml --profile dev logs -f

test-status:
	@echo "Checking service status..."
	docker compose -f docker-compose.yml --profile dev ps

test-api:
	@echo "Testing API endpoints..."
	@chmod +x ./Regex-Scripts/test-connection.sh
	@./Regex-Scripts/test-connection.sh

clean-test:
	@echo "Cleaning up test environment..."
	@docker compose -f docker-compose.yml --profile dev down -v
	@chmod +x ./Regex-Scripts/remove.sh
	@./Regex-Scripts/remove.sh

rebuild-test:
	@echo "Rebuilding test services..."
	docker compose -f docker-compose.yml --profile dev build --no-cache
	docker compose -f docker-compose.yml --profile dev up -d

help:
	@echo "Available commands:"
	@echo "  make test-up      - Start test environment"
	@echo "  make test-down    - Stop test environment"
	@echo "  make test-logs    - View service logs"
	@echo "  make test-status  - Check service status"
	@echo "  make test-api     - Test API endpoints"
	@echo "  make clean-test   - Clean up everything"
	@echo "  make rebuild-test - Rebuild and restart services"
	@echo "  make help         - Show this help"

.PHONY: test-up test-down test-logs test-status test-api clean-test help
