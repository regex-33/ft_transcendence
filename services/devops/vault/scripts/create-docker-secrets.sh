#!/bin/bash

# create-docker-secrets.sh - Create Docker secrets for AppRole credentials

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Wait for vault-init to complete and generate credentials
wait_for_credentials() {
    log "Waiting for Vault initialization to complete..."
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if [ -f "/tmp/vault-init/init-complete" ] && \
           [ -f "/tmp/vault-init/app-role-id" ] && \
           [ -f "/tmp/vault-init/logging-role-id" ] && \
           [ -f "/tmp/vault-init/monitoring-role-id" ]; then
            log "Vault initialization complete and credentials available!"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts - Waiting for Vault initialization..."
        sleep 5
        ((attempt++))
    done
    
    error "Vault initialization did not complete within expected time"
}

# Create Docker secrets from AppRole credentials
create_appRole_secrets() {
    log "Creating Docker secrets for AppRole credentials..."
    
    local services=("app" "logging" "monitoring")
    
    for service in "${services[@]}"; do
        local role_id_file="/tmp/vault-init/${service}-role-id"
        local secret_id_file="/tmp/vault-init/${service}-secret-id"
        
        if [ ! -f "$role_id_file" ] || [ ! -f "$secret_id_file" ]; then
            error "Credentials not found for $service service"
        fi
        
        # Create role-id secret
        local role_id_secret="${service}-role-id"
        if ! docker secret inspect "$role_id_secret" >/dev/null 2>&1; then
            docker secret create "$role_id_secret" "$role_id_file"
            log "Created Docker secret: $role_id_secret"
        else
            warn "Docker secret $role_id_secret already exists"
        fi
        
        # Create secret-id secret
        local secret_id_secret="${service}-secret-id"
        if ! docker secret inspect "$secret_id_secret" >/dev/null 2>&1; then
            docker secret create "$secret_id_secret" "$secret_id_file"
            log "Created Docker secret: $secret_id_secret"
        else
            warn "Docker secret $secret_id_secret already exists"
        fi
    done
}

# Main execution
main() {
    log "Starting Docker secrets creation for AppRole credentials..."
    
    # Check if we're on a swarm manager
    if ! docker node ls >/dev/null 2>&1; then
        error "This script must be run on a Docker Swarm manager node"
    fi
    
    wait_for_credentials
    create_appRole_secrets
    
    log "Docker secrets creation completed successfully!"
    log "AppRole credentials are now available as Docker secrets"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi