# Docker Swarm Cluster Automation Makefile (Updated with Private Registry)
# File: Makefile

# script directory 
SCRIPTS_DIR := ./services/devops/scripts
# stacks directory
STACKS_DIR := ./stacks

# ELK setup Scripts directory
ELK_SCRIPTS_DIR := ./services/devops/logging/setup
# ELK Directory
ELK_DIR := ./services/devops/logging
# Monitoring Directory
MONITORING_DIR := ./services/devops/monitoring

# Include environment variables
include .env
export $(shell sed 's/=.*//' .env)

# SSH Configuration
SSH_USER = root
SSH_PASS = regex-33
SSH_OPTS = -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR

# Default target
.DEFAULT_GOAL := test-up

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

# =========================================

.PHONY: all
all: test-up


.PHONY: test-up
test-up:
	@echo "Starting test environment..."
	docker compose -f docker-compose.yml --profile dev up -d
	@echo "Waiting for services to start..."
	sleep 10
	@echo "Services should be running on:"
	@echo "  - Frontend: http://localhost:${FRONTEND_PORT}"
	@echo "  - Nginx Proxy: http://localhost:${NGINX_PORT}"
	@echo "  - User Service: http://localhost:${USER_SERVICE_PORT}"
	@echo "  - PostgreSQL: localhost:${POSTGRES_PORT}"
	@echo "  - Redis: localhost:${REDIS_PORT}"

.PHONY: test-down
test-down:
	@echo "Stopping test environment..."
	docker compose -f docker-compose.yml --profile dev down

.PHONY: test-logs
test-logs:
	docker compose -f docker-compose.yml --profile dev logs -f

.PHONY: test-status
test-status:
	@echo "Checking service status..."
	docker compose -f docker-compose.yml --profile dev ps

.PHONY: rebuild-test
rebuild-test:
	@echo "Rebuilding test services..."
	docker compose -f docker-compose.yml --profile dev build --no-cache
	docker compose -f docker-compose.yml --profile dev up

rebuild-service:
	@echo "Rebuilding specific service..."
	@read -p "Enter service name to rebuild: " service; \
	if [ ! -z "$$service" ]; then \
		docker compose -f docker-compose.yml --profile dev build --no-cache $$service; \
		docker compose -f docker-compose.yml --profile dev up -d $$service; \
	else \
		echo "No service name provided. Aborting."; \
	fi


# ==========================================================

# Help target
.PHONY: help
help:
	@echo "$(BLUE)Docker Swarm Cluster Management with Private Registry$(NC)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@echo "  $(GREEN)swarm-cluster$(NC)     - Complete cluster setup with private registry (recommended)"
	@echo "  $(GREEN)prepare-nodes$(NC)     - Install Docker and prepare all nodes"
	@echo "  $(GREEN)init-swarm$(NC)        - Initialize Docker Swarm"
	@echo "  $(GREEN)join-workers$(NC)      - Join worker nodes to swarm"
	@echo "  $(GREEN)setup-registry$(NC)    - Setup private Docker registry"
	@echo "  $(GREEN)build-images$(NC)      - Build all Docker images locally"
	@echo "  $(GREEN)push-images$(NC)       - Push images to private registry"
	@echo "  $(GREEN)deploy-all$(NC)        - Deploy all stacks using private registry"
	@echo "  $(GREEN)destroy-cluster$(NC)   - Destroy entire cluster"
	@echo "  $(GREEN)status$(NC)            - Show cluster status"
	@echo "  $(GREEN)logs$(NC)              - Show service logs"
	@echo "  $(GREEN)scale$(NC)             - Scale services"
	@echo "  $(GREEN)update$(NC)            - Update a specific service"
	@echo "  $(GREEN)backup$(NC)            - Backup important data"
	@echo ""
	@echo "$(YELLOW)Registry Management:$(NC)"
	@echo "  $(GREEN)registry-status$(NC)   - Show private registry status"
	@echo "  $(GREEN)registry-images$(NC)   - List images in private registry"
	@echo "  $(GREEN)registry-clean$(NC)    - Clean unused images from registry"
	@echo ""
	@echo "$(YELLOW)SSL Setup:$(NC)"
	@echo "  $(GREEN)generate-certs$(NC)    - Generate self-signed SSL certificates"
	@echo "  $(GREEN)show-hosts$(NC)        - Show /etc/hosts entries needed"
	@echo ""
	@echo "$(YELLOW)Vault Management:$(NC)"
	@echo "  $(GREEN)vault-status$(NC)      - Show Vault status"
	@echo "  $(GREEN)vault-unseal$(NC)      - Unseal Vault"
	@echo "  $(GREEN)vault-logs$(NC)        - Show Vault logs"
	@echo ""
	@echo "$(YELLOW)Environment variables required in .env:$(NC)"
	@echo "  MANAGER_IP=<ip_address>"
	@echo "  WORKER1_IP=<ip_address>  # Logging node"
	@echo "  WORKER2_IP=<ip_address>  # Monitoring node (optional)"

	@echo ""
	@echo "$(YELLOW)Quick deploy...$(NC)"
	@echo "  $(RED)make test-up$(NC)      - Start test environment"
	@echo "  $(RED)make test-down$(NC)    - Stop test environment"
	@echo "  $(RED)make test-logs$(NC)    - View service logs"
	@echo "  $(RED)make test-status$(NC)  - Check service status"
	@echo "  $(RED)make test-api$(NC)     - Test API endpoints"
	@echo "  $(RED)make clean-tes$(NC)    - Clean up everything"
	@echo "  $(RED)make rebuild-tes$(NC)  - Rebuild and restart services"
	@echo "  $(RED)make help$(NC)         - Show this help"


.PHONY: keystore
keystore:		## Setup Elasticsearch Keystore, by initializing passwords, and add credentials defined in `keystore.sh`.
	docker-compose -f ${STACKS_DIR}/docker-compose.setup.yml run --rm keystore

.PHONY: certs
certs:		    ## Generate Elasticsearch SSL Certs.
	docker-compose -f ${STACKS_DIR}/docker-compose.setup.yml run --rm certs

.PHONY: setup
setup:		    ## Generate Elasticsearch SSL Certs and Keystore.
	@make certs
	@make keystore



# Build all Docker images
.PHONY: build-images
build-images: generate-certs
	@echo "$(BLUE) Building Docker images...$(NC)"
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/frontend ./services/frontend/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/user-service ./services/user-service/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/chat-service ./services/chat-service/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/nginx ./services/devops/nginx/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/postgres ./services/devops/databases/postgres/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/redis ./services/devops/databases/redis/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/elasticsearch ./services/devops/logging/elasticsearch/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/logstash ./services/devops/logging/logstash/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/kibana ./services/devops/logging/kibana/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/filebeat ./services/devops/logging/filebeat/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/prometheus ./services/devops/monitoring/prometheus/
	@docker build --build-arg ELK_VERSION=$(ELK_VERSION) -t ft_transcendence/grafana ./services/devops/monitoring/grafana/
	@docker build -t ft_transcendence/traefik ./services/devops/traefik/
	@docker build -t ft_transcendence/vault ./services/devops/vault/
	@docker build -t ft_transcendence/redis-exporter ./services/devops/exporters/redis-exporter/
	@docker build -t ft_transcendence/postgres-exporter ./services/devops/exporters/postgres-exporter/
	@docker build -t ft_transcendence/elasticsearch-exporter ./services/devops/exporters/elasticsearch-exporter/
	@echo "$(GREEN)✓ All images built successfully$(NC)"

# Push images to private registry
.PHONY: push-images
push-images: check-env
	@echo "$(BLUE) Pushing images to private registry...$(NC)"
	@chmod +x $(SCRIPTS_DIR)/push-images.sh
	@$(SCRIPTS_DIR)/push-images.sh $(MANAGER_IP)
	@echo "$(GREEN)✓ Images pushed to registry successfully$(NC)"

# List all docker-compose and stack files in stacks directory
.PHONY: list-stacks
list-stacks:
	@echo "$(BLUE)Docker Compose & Stack files in stacks directory:$(NC)"
	@find stacks -type f -name 'docker-compose*.yml' -exec echo "  - {}" \;

#=======================================================================================================================================================
#==============================================      REGISTRY    =======================================================================================
#=======================================================================================================================================================

# Setup private Docker registry
.PHONY: setup-registry
setup-registry: check-env
	@echo "$(BLUE) Setting up private Docker registry...$(NC)"
	@chmod +x $(SCRIPTS_DIR)/setup-registry.sh
	@$(SCRIPTS_DIR)/setup-registry.sh $(MANAGER_IP)
	@echo "$(GREEN)✓ Private registry setup completed$(NC)"

# Registry status
.PHONY: registry-status
registry-status: check-env
	@echo "$(BLUE) Private Registry Status$(NC)"
	@echo "$(YELLOW)Registry connectivity:$(NC)"
	@curl -s http://$(MANAGER_IP):5000/v2/ && echo "$(GREEN)✓ Registry is accessible$(NC)" || echo "$(RED)✗ Registry is not accessible$(NC)"
	@echo ""
	@echo "$(YELLOW)Registry service status:$(NC)"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker service ls --filter name=ft-registry"

# List images in private registry
.PHONY: registry-images
registry-images: check-env
	@echo "$(BLUE) Images in Private Registry$(NC)"
	@curl -s http://$(MANAGER_IP):5000/v2/_catalog | python3 -c "import json,sys; data=json.load(sys.stdin); [print(f'  - {repo}') for repo in data.get('repositories', [])]" 2>/dev/null || curl -s http://$(MANAGER_IP):5000/v2/_catalog

# Clean unused images from registry
.PHONY: registry-clean
registry-clean: check-env
	@echo "$(RED) WARNING: This will clean up unused images in the registry!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker exec \$$(docker ps -f name=ft-registry_registry -q) registry garbage-collect /etc/docker/registry/config.yml"; \
		echo "$(GREEN)✓ Registry cleanup completed$(NC)"; \
	else \
		echo "$(YELLOW)Registry cleanup cancelled$(NC)"; \
	fi

#=======================================================================================================================================================
#=========================================================  Configuration  =============================================================================
#=======================================================================================================================================================



# Generate self-signed SSL certificates
.PHONY: generate-certs
generate-certs:
	@echo "$(BLUE) Generating self-signed SSL certificates...$(NC)"
	@chmod +x $(ELK_SCRIPTS_DIR)/generate-self-signed-certs.sh
	@$(ELK_SCRIPTS_DIR)/generate-self-signed-certs.sh
	@echo "$(GREEN)✓ SSL certificates generated$(NC)"

# Show required /etc/hosts entries
.PHONY: show-hosts
show-hosts:
	@echo "$(YELLOW)Add these entries to your /etc/hosts file:$(NC)"
	@echo "$(MANAGER_IP)    regex-33.com"
	@echo "$(MANAGER_IP)    traefik.regex-33.com"
	@echo "$(MANAGER_IP)    registry.regex-33.com"
	@echo "$(MANAGER_IP)    registry-ui.regex-33.com"
	@echo "$(WORKER1_IP)    logging.regex-33.com"
	@echo "$(WORKER2_IP)    monitoring.regex-33.com"
	@echo "$(WORKER2_IP)    prometheus.regex-33.com"
	@echo "$(WORKER2_IP)    alertmanager.regex-33.com"
	@echo ""
	@echo "$(RED) Note: You'll need to accept self-signed certificate warnings in your browser$(NC)"

# Check if required environment variables are set
.PHONY: check-env
check-env:
	@echo "$(BLUE) Checking environment variables...$(NC)"
	@if [ -z "$(MANAGER_IP)" ]; then echo "$(RED)✗ MANAGER_IP not set in .env$(NC)"; exit 1; fi
	@if [ -z "$(WORKER1_IP)" ]; then echo "$(RED)✗ WORKER1_IP not set in .env$(NC)"; exit 1; fi
	@if [ -z "$(WORKER2_IP)" ]; then echo "$(RED)✗ WORKER2_IP not set in .env$(NC)"; exit 1; fi
	@echo "$(GREEN)✓ Environment variables verified$(NC)"

# Prepare all nodes (install Docker, create directories, etc.)
.PHONY: prepare-nodes
prepare-nodes: check-env
	@echo "$(BLUE) Preparing all nodes...$(NC)"
	@echo "$(YELLOW)Preparing Manager Node ($(MANAGER_IP))...$(NC)"
	@chmod +x $(SCRIPTS_DIR)/prepare-nodes.sh
	@$(SCRIPTS_DIR)/prepare-nodes.sh $(MANAGER_IP) manager
	@echo "$(YELLOW)Preparing Worker Node 1 - Logging ($(WORKER1_IP))...$(NC)"
	@$(SCRIPTS_DIR)/prepare-nodes.sh $(WORKER1_IP) logging
	@echo "$(YELLOW)Preparing Worker Node 2 - Monitoring ($(WORKER2_IP))...$(NC)"
	@$(SCRIPTS_DIR)/prepare-nodes.sh $(WORKER2_IP) monitoring
	@echo "$(GREEN)✓ All nodes prepared successfully$(NC)"

# Initialize Docker Swarm on manager node
.PHONY: init-swarm
init-swarm: check-env
	@echo "$(BLUE) Initializing Docker Swarm...$(NC)"
	@chmod +x $(SCRIPTS_DIR)/setup-swarm.sh
	@$(SCRIPTS_DIR)/setup-swarm.sh init $(MANAGER_IP)
	@echo "$(GREEN)✓ Docker Swarm initialized$(NC)"

# Join worker nodes to the swarm
.PHONY: join-workers
join-workers: check-env
	@echo "$(BLUE) Joining worker nodes to swarm...$(NC)"
	@$(SCRIPTS_DIR)/setup-swarm.sh join $(MANAGER_IP) $(WORKER1_IP) $(WORKER2_IP);
	@echo "$(GREEN)✓ Worker nodes joined successfully$(NC)"

# Configure nodes (labels, networks, configs)
.PHONY: configure-nodes
configure-nodes: check-env
	@echo "$(BLUE) Configuring nodes...$(NC)"
	@$(SCRIPTS_DIR)/setup-swarm.sh configure $(MANAGER_IP) $(WORKER1_IP) $(WORKER2_IP)
	@echo "$(GREEN)✓ Nodes configured successfully$(NC)"

# Show cluster status
.PHONY: status
status: check-env
	@echo "$(BLUE) Cluster Status$(NC)"
	@echo "$(YELLOW)Nodes:$(NC)"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker node ls" || echo "$(RED)✗ Cannot connect to manager$(NC)"
	@echo ""
	@echo "$(YELLOW)Services:$(NC)"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker service ls" || echo "$(RED)✗ Cannot get services$(NC)"
	@echo ""
	@echo "$(YELLOW)Stacks:$(NC)"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker stack ls" || echo "$(RED)✗ Cannot get stacks$(NC)"
	@echo ""
	@make registry-status


#=======================================================================================================================================================
# ============================================== 	DEPLOYMENT	========================================================================================
#=======================================================================================================================================================

# Deploy all stacks using private registry
.PHONY: deploy-all
deploy-all: check-env deploy-vault
	@echo "$(BLUE) Deploying all stacks with private registry...$(NC)"
	@chmod +x $(SCRIPTS_DIR)/deploy-stacks.sh
	@$(SCRIPTS_DIR)/deploy-stacks.sh $(MANAGER_IP) $(WORKER1_IP) $(WORKER2_IP)

	@echo "$(GREEN)✓ All stacks deployed successfully$(NC)"

# Main target: Complete cluster setup with private registry
.PHONY: swarm-cluster
swarm-cluster: check-env check-prerequisites test-connection prepare-nodes destroy-containers-volume destroy-cluster init-swarm join-workers configure-nodes generate-certs setup build-images setup-registry push-images deploy-all
	@echo "$(GREEN)✓ Docker Swarm cluster with private registry setup completed successfully!$(NC)"
	@echo ""
	@echo "$(YELLOW)Access Points:$(NC)"
	@echo "  Application: https://regex-33.com"
	@echo "  Private Registry: http://$(MANAGER_IP):5000"
	@echo "  Registry UI: http://$(MANAGER_IP):5001"
	@echo "  Traefik Dashboard: https://traefik.regex-33.com (admin/admin123)"
	@echo "  Kibana: https://logging.regex-33.com"
	@echo "  Grafana: https://monitoring.regex-33.com"
	@echo "  Prometheus: https://prometheus.regex-33.com (admin/admin123)"
	@echo ""
	@echo "$(YELLOW)Vault Access:$(NC)"
	@echo "  Vault UI: https://vault.regex-33.com"
	@echo ""
	@make show-hosts

# Deploy Vault stack
.PHONY: deploy-vault
deploy-vault: check-env
	@echo "$(BLUE)Deploying Vault stack...$(NC)"
	@chmod +x ./services/devops/vault/scripts/vault-integration.sh
	@./services/devops/vault/scripts/vault-integration.sh deploy
	@echo "$(GREEN)Vault stack deployed$(NC)"


# Complete cluster setup with Vault
.PHONY: swarm-cluster-vault
swarm-cluster-vault: check-env check-prerequisites test-connection prepare-nodes destroy-containers-volume destroy-cluster init-swarm join-workers configure-nodes generate-certs setup build-images setup-registry push-images deploy-all
	@echo "$(GREEN)✓ Docker Swarm cluster with Vault setup completed successfully!$(NC)"
	@echo ""
	@echo "$(YELLOW)Access Points:$(NC)"
	@echo "  Application: https://regex-33.com"
	@echo "  Vault UI: https://vault.regex-33.com"
	@echo "  Private Registry: http://$(MANAGER_IP):5000"
	@echo "  Traefik Dashboard: https://traefik.regex-33.com"
	@echo "  Kibana: https://logging.regex-33.com"
	@echo "  Grafana: https://monitoring.regex-33.com"
	@echo "  Prometheus: https://prometheus.regex-33.com"
	@echo "  Vault: https://vault.regex-33.com"
	@echo ""
	@make show-hosts


#=======================================================================================================================================================
#=========================================================  Destroy  ===================================================================================
#=======================================================================================================================================================

destroy-containers-volume: check-env
	@echo "$(RED) WARNING: This will stop and remove all containers and volumes on all nodes!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		for node in $(MANAGER_IP) $(WORKER1_IP) $(WORKER2_IP); do \
			echo "$(BLUE) Stopping all containers on $$node...$(NC)"; \
			sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$$node "docker stop \$(docker ps -aq) 2>/dev/null || true"; \
			echo "$(BLUE) Removing all containers on $$node...$(NC)"; \
			sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$$node "docker rm -f \$(docker ps -aq) 2>/dev/null || true"; \
			echo "$(BLUE) Removing all volumes on $$node...$(NC)"; \
			sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$$node "docker volume rm \$(docker volume ls -q) 2>/dev/null || true"; \
		done; \
		echo "$(GREEN)✓ All containers and volumes removed on all nodes$(NC)"; \
	else \
		echo "$(YELLOW)Operation cancelled$(NC)"; \
	fi

# Destroy entire cluster
.PHONY: destroy-cluster
destroy-cluster: check-env
	@echo "$(RED) WARNING: This will destroy the entire cluster!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(BLUE) Destroying cluster...$(NC)"; \
		sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker stack rm ft-app ft-logging ft-monitoring ft-registry || true"; \
		sleep 10; \
		sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker swarm leave --force || true"; \
		sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(WORKER1_IP) "docker swarm leave || true"; \
		sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(WORKER2_IP) "docker swarm leave || true"; \
		echo "$(GREEN)✓ Cluster destroyed$(NC)"; \
	else \
		echo "$(YELLOW)Operation cancelled$(NC)"; \
	fi

# Clean up unused resources on all nodes
.PHONY: cleanup
cleanup: check-env
	@echo "$(BLUE) Cleaning up unused resources...$(NC)"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker system prune -f"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(WORKER1_IP) "docker system prune -f"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(WORKER2_IP) "docker system prune -f"
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

#=======================================================================================================================================================
#=========================================================  Vault  ===================================================================================
#=======================================================================================================================================================



.PHONY: vault-unseal
vault-unseal: check-env
	@echo "$(BLUE)Unsealing Vault...$(NC)"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker service logs ft-vault_vault-init --tail 50"
	@echo ""
	@echo "$(YELLOW)To get unseal keys and root token:$(NC)"

	@cid=$$(docker ps -f name=ft-vault_vault -q | head -1); \
	if [ -n "$$cid" ]; then \
		echo "$(YELLOW)Keys:$(NC)"; \
		if docker exec $$cid test -f /vault/data/vault-init.json; then \
			docker exec $$cid cat /vault/data/vault-init.json | jq -r '.unseal_keys_b64 // .keys_base64 // .keys | .[]'; \
		else \
			echo "$(RED)✗ vault-init.json not found inside container$(NC)"; \
		fi; \
	else \
		vol=$$(docker volume ls -q | grep -E '(vault.*data|ft-vault_vault-data)' | head -1 || true); \
		if [ -n "$$vol" ]; then \
			echo "$(YELLOW)Keys (from volume):$(NC)"; \
			docker run --rm -v $$vol:/vault/data alpine cat /vault/data/vault-init.json | jq -r '.unseal_keys_b64 // .keys_base64 // .keys | .[]'; \
		else \
			echo "$(RED)✗ No running Vault container and no Vault data volume found$(NC)"; \
			exit 1; \
		fi; \
	fi

	@echo ""
	@echo "$(YELLOW)Root Token:$(NC)"
	@cid=$$(docker ps -f name=ft-vault_vault -q | head -1); \
	if [ -n "$$cid" ]; then \
		docker exec $$cid cat /vault/data/vault-init.json | jq -r '.root_token'; \
	else \
		vol=$$(docker volume ls -q | grep -E '(vault.*data|ft-vault_vault-data)' | head -1 || true); \
		if [ -n "$$vol" ]; then \
			docker run --rm -v $$vol:/vault/data alpine cat /vault/data/vault-init.json | jq -r '.root_token'; \
		else \
			echo "$(RED)✗ Could not retrieve root token$(NC)"; \
			exit 1; \
		fi; \
	fi
	@echo ""
	@echo "$(YELLOW)To export root token for current shell:$(NC)"
	@cid=$$(docker ps -f name=ft-vault_vault -q | head -1); \
	if [ -n "$$cid" ]; then \
		root=$$(docker exec $$cid cat /vault/data/vault-init.json | jq -r '.root_token'); \
	else \
		vol=$$(docker volume ls -q | grep -E '(vault.*data|ft-vault_vault-data)' | head -1 || true); \
		if [ -n "$$vol" ]; then \
			root=$$(docker run --rm -v $$vol:/vault/data alpine cat /vault/data/vault-init.json | jq -r '.root_token'); \
		else \
			echo "$(RED)✗ Could not retrieve root token$(NC)"; \
			exit 1; \
		fi; \
	fi; \
	echo "export VAULT_TOKEN=$$root"


.PHONY: vault-logs
vault-logs: check-env
	@echo "$(BLUE)Vault Logs$(NC)"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker service logs ft-vault_vault --follow"

# Show service logs
.PHONY: logs
logs: check-env
	@echo "$(BLUE)Service Logs$(NC)"
	@echo "$(YELLOW)Available stacks:$(NC)"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker stack ls"
	@echo ""
	@read -p "Enter stack name to view logs: " stack; \
	if [ ! -z "$$stack" ]; then \
		sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker service logs $$stack --follow"; \
	fi

#=======================================================================================================================================================
#=========================================================  Cluster Update & Backup & Check  ===========================================================
#=======================================================================================================================================================

# Scale services
.PHONY: scale
scale: check-env
	@echo "$(BLUE)Scale Services$(NC)"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker service ls"
	@echo ""
	@read -p "Enter service name: " service; \
	read -p "Enter number of replicas: " replicas; \
	if [ ! -z "$$service" ] && [ ! -z "$$replicas" ]; then \
		sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker service scale $$service=$$replicas"; \
	fi

# Update a specific service
.PHONY: update
update: check-env
	@echo "$(BLUE) Update Service$(NC)"
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker service ls"
	@echo ""
	@read -p "Enter service name to update: " service; \
	if [ ! -z "$$service" ]; then \
		sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker service update --force $$service"; \
	fi
# Backup important data
.PHONY: backup
backup: check-env
	@echo "$(BLUE) Creating backup...$(NC)"
	@mkdir -p ./backups/$(shell date +%Y%m%d_%H%M%S)
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP) "docker run --rm -v ft-app_postgres-data:/data -v /tmp:/backup alpine tar czf /backup/postgres_backup_$(shell date +%Y%m%d_%H%M%S).tar.gz -C /data ."
	@sshpass -p $(SSH_PASS) scp $(SSH_OPTS) $(SSH_USER)@$(MANAGER_IP):/tmp/postgres_backup_*.tar.gz ./backups/$(shell date +%Y%m%d_%H%M%S)/
	@echo "$(GREEN)✓ Backup completed$(NC)"


# Check prerequisites
.PHONY: check-prerequisites
check-prerequisites:
	@echo "$(BLUE) Checking prerequisites...$(NC)"
	@command -v sshpass >/dev/null 2>&1 || { echo "$(RED)✗ sshpass is required but not installed$(NC)"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)✗ docker is required but not installed$(NC)"; exit 1; }
	@command -v openssl >/dev/null 2>&1 || { echo "$(RED)✗ openssl is required but not installed$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Prerequisites check passed$(NC)"

# Test connectivity to all nodes
.PHONY: test-connection
test-connection: check-env
	@echo "$(BLUE) Testing connectivity to all nodes...$(NC)"
	@echo -n "Manager ($(MANAGER_IP)): "
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) -o ConnectTimeout=5 $(SSH_USER)@$(MANAGER_IP) "echo 'OK'" 2>/dev/null && echo "$(GREEN)✓$(NC)" || echo "$(RED)✗$(NC)"
	@echo -n "Worker1 ($(WORKER1_IP)): "
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) -o ConnectTimeout=5 $(SSH_USER)@$(WORKER1_IP) "echo 'OK'" 2>/dev/null && echo "$(GREEN)✓$(NC)" || echo "$(RED)✗$(NC)"
	@echo -n "Worker2 ($(WORKER2_IP)): "
	@sshpass -p $(SSH_PASS) ssh $(SSH_OPTS) -o ConnectTimeout=5 $(SSH_USER)@$(WORKER2_IP) "echo 'OK'" 2>/dev/null && echo "$(GREEN)✓$(NC)" || echo "$(RED)✗$(NC)"
