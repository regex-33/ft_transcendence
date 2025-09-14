#!/bin/bash

# init-vault.sh - Initialize Vault server and setup secrets with AppRole

set -euo pipefail

# Configuration
VAULT_ADDR="${VAULT_ADDR:-http://vault:8200}"
VAULT_INIT_FILE="/tmp/vault-init/vault-init.json"
VAULT_CONFIG_DIR="/vault/config"
VAULT_POLICIES_DIR="/vault/policies"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Wait for Vault to be responsive
wait_for_vault_server() {
    log "Waiting for Vault server to be responsive..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$VAULT_ADDR/v1/sys/health?uninitcode=200&sealedcode=200" >/dev/null 2>&1; then
            log "Vault server is responsive!"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts - Vault server not responsive yet, waiting..."
        sleep 5
        ((attempt++))
    done
    
    error "Vault server failed to become responsive after $max_attempts attempts"
}

# Check if Vault is initialized
is_initialized() {
    local response=$(curl -s "$VAULT_ADDR/v1/sys/init" 2>/dev/null || echo '{"initialized":false}')
    echo "$response" | jq -r '.initialized'
}

# Initialize Vault
init_vault() {
    log "Checking if Vault is already initialized..."
    
    if [[ "$(is_initialized)" == "true" ]]; then
        warn "Vault is already initialized"
        return 0
    fi
    
    log "Initializing Vault..."
    
    mkdir -p "$(dirname "$VAULT_INIT_FILE")"
    
    local response=$(curl -s -X POST "$VAULT_ADDR/v1/sys/init" \
        -H "Content-Type: application/json" \
        -d '{
            "secret_shares": 5,
            "secret_threshold": 3
        }')
    
    if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
        echo "$response" > "$VAULT_INIT_FILE"
        chmod 600 "$VAULT_INIT_FILE"
        log "Vault initialized successfully"
        
        cp "$VAULT_INIT_FILE" "/vault/data/vault-init.json" 2>/dev/null || true
    else
        error "Failed to initialize Vault. Response: $response"
    fi
}

# Unseal Vault
unseal_vault() {
    log "Checking if Vault needs to be unsealed..."
    
    local health_response=$(curl -s "$VAULT_ADDR/v1/sys/health" 2>/dev/null || echo '{"sealed":true}')
    local sealed=$(echo "$health_response" | jq -r '.sealed')
    
    if [[ "$sealed" == "false" ]]; then
        log "Vault is already unsealed"
        return 0
    fi
    
    if [ ! -f "$VAULT_INIT_FILE" ]; then
        error "Vault initialization file not found: $VAULT_INIT_FILE"
    fi
    
    log "Unsealing Vault..."
    
    local unseal_keys=($(cat "$VAULT_INIT_FILE" | jq -r '.keys[]'))
    
    if [ ${#unseal_keys[@]} -lt 3 ]; then
        error "Not enough unseal keys found in $VAULT_INIT_FILE"
    fi
    
    log "Found ${#unseal_keys[@]} unseal keys, threshold is 3"
    
    for i in {0..2}; do
        log "Using unseal key $((i+1))/3..."
        local unseal_response=$(curl -s -w "%{http_code}" -X POST "$VAULT_ADDR/v1/sys/unseal" \
            -H "Content-Type: application/json" \
            -d "{\"key\": \"${unseal_keys[$i]}\"}")
        
        local http_code="${unseal_response: -3}"
        local response_body="${unseal_response%???}"
        
        if [[ "$http_code" == "200" ]]; then
            local sealed_status=$(echo "$response_body" | jq -r '.sealed')
            local progress=$(echo "$response_body" | jq -r '.progress')
            local threshold=$(echo "$response_body" | jq -r '.threshold')
            
            log "Unseal progress: $progress/$threshold, Sealed: $sealed_status"
            
            if [[ "$sealed_status" == "false" ]]; then
                log "Vault unsealed successfully after $((i+1)) keys"
                return 0
            fi
        else
            warn "Unseal attempt failed with HTTP code: $http_code"
        fi
        
        sleep 1
    done
    
    sleep 2
    local final_health=$(curl -s "$VAULT_ADDR/v1/sys/health" 2>/dev/null || echo '{"sealed":true}')
    local final_sealed=$(echo "$final_health" | jq -r '.sealed')
    
    if [[ "$final_sealed" == "false" ]]; then
        log "Vault unsealed successfully! Vault is ready to use."
        return 0
    else
        error "Failed to unseal Vault. Vault is still sealed."
    fi
}

# Authenticate with root token
auth_vault() {
    if [ ! -f "$VAULT_INIT_FILE" ]; then
        error "Vault initialization file not found: $VAULT_INIT_FILE"
    fi
    
    local root_token=$(cat "$VAULT_INIT_FILE" | jq -r '.root_token')
    if [[ -z "$root_token" || "$root_token" == "null" ]]; then
        error "Could not extract root token from $VAULT_INIT_FILE"
    fi
    
    export VAULT_TOKEN="$root_token"
    
    local auth_test=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" "$VAULT_ADDR/v1/auth/token/lookup-self")
    if [[ $? -ne 0 ]]; then
        error "Failed to authenticate with root token"
    fi
    
    log "Authenticated with Vault using root token"
}

# Enable secrets engines
enable_secrets_engines() {
    log "Enabling secrets engines..."
    
    # Check if KV v2 is already enabled
    local mounts_response=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" "$VAULT_ADDR/v1/sys/mounts")
    local kv_enabled=$(echo "$mounts_response" | jq -r '.["secret/"] // empty')
    
    if [[ -z "$kv_enabled" ]]; then
        # Enable KV v2 secrets engine
        local kv_response=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
            -X POST "$VAULT_ADDR/v1/sys/mounts/secret" \
            -d '{
                "type": "kv",
                "options": {
                    "version": "2"
                }
            }')
        
        log "Enabled KV v2 secrets engine at secret/"
    else
        log "KV v2 secrets engine already enabled"
    fi
    
    # Enable database secrets engine
    local db_enabled=$(echo "$mounts_response" | jq -r '.["database/"] // empty')
    if [[ -z "$db_enabled" ]]; then
        curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
            -X POST "$VAULT_ADDR/v1/sys/mounts/database" \
            -d '{"type": "database"}' >/dev/null 2>&1
        log "Enabled database secrets engine"
    else
        log "Database secrets engine already enabled"
    fi
}

# Enable auth methods
enable_auth_methods() {
    log "Enabling authentication methods..."
    
    local auth_response=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" "$VAULT_ADDR/v1/sys/auth")
    
    # Enable userpass auth method
    #  Add this here
    echo "[*] Enabling userpass auth method..."
    vault auth enable userpass || echo "userpass already enabled"
    local userpass_enabled=$(echo "$auth_response" | jq -r '.["userpass/"]')
    if [[ -z "$userpass_enabled" ]]; then
        curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
            -X POST "$VAULT_ADDR/v1/sys/auth/userpass" \
            -d '{"type": "userpass"}' >/dev/null 2>&1
        log "Enabled userpass authentication method"
    fi
    
    # Enable AppRole auth method
    echo "[*] Enabling AppRole auth method..."
    vault auth enable approle || echo "approle already enabled"

    # Check if AppRole is already enabled
    local approle_enabled=$(echo "$auth_response" | jq -r '.["approle/"]')
    if [[ -z "$approle_enabled" ]]; then
        curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
            -X POST "$VAULT_ADDR/v1/sys/auth/approle" \
            -d '{"type": "approle"}' >/dev/null 2>&1
        log "Enabled AppRole authentication method"
    fi
}

# Create policies
create_policies() {
    log "Creating Vault policies..."
    
    # App policy file
    local app_policy_file_path="/vault/config/policies/app-policy.hcl"
    curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
        -X POST "$VAULT_ADDR/v1/sys/policies/acl/app-policy" \
        -d "{\"policy\": $(cat "$app_policy_file_path" | jq -Rs .)}" >/dev/null


    #Logging policy file path
    local logging_policy_file_path="/vault/config/policies/logging-policy.hcl"
    curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
        -X POST "$VAULT_ADDR/v1/sys/policies/acl/logging-policy" \
        -d "{\"policy\": $(cat "$logging_policy_file_path" | jq -Rs .)}" >/dev/null

    # Monitoring policy file path
    local monitoring_policy_file_path="/vault/config/policies/monitoring-policy.hcl"
    curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
        -X POST "$VAULT_ADDR/v1/sys/policies/acl/monitoring-policy" \
        -d "{\"policy\": $(cat "$monitoring_policy_file_path" | jq -Rs .)}" >/dev/null

    log "Created policies: app-policy, logging-policy, monitoring-policy"
}

# Create AppRole roles and generate credentials
setup_approles() {
    log "Setting up AppRole authentication..."
    
    local services=("app" "logging" "monitoring")
    
    for service in "${services[@]}"; do
        log "Creating AppRole for $service service..."
        
        # Create the role
        local role_config='{
            "token_policies": ["'${service}'-policy"],
            "token_ttl": "1h",
            "token_max_ttl": "4h",
            "bind_secret_id": true
        }'
        
        curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
            -X POST "$VAULT_ADDR/v1/auth/approle/role/$service" \
            -d "$role_config" >/dev/null
        
        # Get role-id
        local role_id_response=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
            "$VAULT_ADDR/v1/auth/approle/role/$service/role-id")
        local role_id=$(echo "$role_id_response" | jq -r '.data.role_id')
        
        # Generate secret-id
        local secret_id_response=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
            -X POST "$VAULT_ADDR/v1/auth/approle/role/$service/secret-id")
        local secret_id=$(echo "$secret_id_response" | jq -r '.data.secret_id')
        
        # Store credentials in shared volume
        echo "$role_id" > "/tmp/vault-init/${service}-role-id"
        echo "$secret_id" > "/tmp/vault-init/${service}-secret-id"
        
        log "Created AppRole for $service: role-id and secret-id generated"
    done
}

# Store initialization status
mark_init_complete() {
    log "Marking initialization as complete..."
    echo "$(date): Vault initialization completed successfully" > "/tmp/vault-init/init-complete"
}

# Main execution
main() {
    log "Starting Vault initialization process..."
    
    export VAULT_ADDR="$VAULT_ADDR"
    
    if [ -f "/tmp/vault-init/init-complete" ]; then
        log "Vault initialization already completed, exiting..."
        exit 0
    fi
    
    wait_for_vault_server
    init_vault
    unseal_vault
    auth_vault
    enable_secrets_engines
    enable_auth_methods    # MOVED THIS BEFORE create_policies
    create_policies
    setup_approles
    mark_init_complete
    
    log "Vault initialization completed successfully!"
    log "Root token and unseal keys are stored in: $VAULT_INIT_FILE"
    log "AppRole credentials stored in /tmp/vault-init/ for each service"
    
    warn "IMPORTANT: Store the root token and unseal keys securely!"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi