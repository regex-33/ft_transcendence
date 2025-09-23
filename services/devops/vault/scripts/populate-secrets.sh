#!/bin/bash

# populate-secrets.sh - Populate Vault with secrets from environment variables

set -euo pipefail

# Configuration
# VAULT_ADDR="${VAULT_ADDR:-http://127.0.0.1:8200}"
VAULT_ADDR="${VAULT_ADDR:-http://vault:8200}"
VAULT_INIT_FILE="/tmp/vault-init/vault-init.json"

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

# Debug function to check connectivity
debug_vault_connectivity() {
    log "=== Vault Connectivity Debug ==="
    log "VAULT_ADDR: $VAULT_ADDR"
    
    # Test basic connectivity
    if ping -c 1 -W 5 vault >/dev/null 2>&1; then
        log "✓ Can ping vault hostname"
    else
        warn "✗ Cannot ping vault hostname"
    fi
    
    # Test port connectivity
    if timeout 5 bash -c "</dev/tcp/vault/8200" >/dev/null 2>&1; then
        log "✓ Port 8200 is reachable on vault"
    else
        warn "✗ Port 8200 is not reachable on vault"
    fi
    
    # Show network info
    log "Network interfaces:"
    ip addr show 2>/dev/null | grep -E "(inet |UP)" | head -10 || echo "ip command not available"
    
    log "DNS resolution for vault:"
    nslookup vault 2>/dev/null || getent hosts vault 2>/dev/null || echo "DNS resolution failed"
}

# Check if Vault is sealed
is_vault_sealed() {
    local health_response
    health_response=$(curl -s "$VAULT_ADDR/v1/sys/health" 2>/dev/null || echo '{"sealed":true}')
    local sealed=$(echo "$health_response" | jq -r '.sealed')
    [[ "$sealed" == "true" ]]
}

manual_unseal() {
    log "Attempting manual unseal..."
    
    # Look for init file in various locations
    local init_file="/tmp/vault-init/vault-init.json"

    if  test -f "$init_file"; then
        log "Found init file at: $init_file"
    else
        error "Cannot find vault init file. Please check vault-init service logs."
    fi

    if [[ -z "$init_file" ]]; then
        error "Cannot find vault init file. Please check vault-init service logs."
    fi

    local unseal_keys=($(cat "$init_file" | jq -r '.keys[]'))

    echo "Unseal keys found: ${unseal_keys[@]} | Size is ${#unseal_keys[@]}"
    if [ ${#unseal_keys[@]} -lt 3 ]; then
        error "Not enough unseal keys found"
        return 1
    fi
    
    log "Using 3 unseal keys (threshold: 3)"
    
    # Use first 3 keys to unseal
    for i in {0..2}; do
        log "Applying unseal key $((i+1))/3..."
        
        local response
        response=$(curl -s -w "%{http_code}" -X POST "$VAULT_ADDR/v1/sys/unseal" \
            -H "Content-Type: application/json" \
            -d "{\"key\": \"${unseal_keys[$i]}\"}" 2>/dev/null)
        echo "=================="
        echo "$response"
        echo "=================="

        local http_code="${response: -3}"
        local response_body="${response%???}"
        
        if [[ "$http_code" == "200" ]]; then
            local sealed_status=$(echo "$response_body" | jq -r '.sealed')
            local progress=$(echo "$response_body" | jq -r '.progress')
            
            log "Progress: $progress/3, Sealed: $sealed_status"
            
            if [[ "$sealed_status" == "false" ]]; then
                log "Vault unsealed successfully!"
                return 0
            fi
        else
            warn "Unseal attempt $((i+1)) failed (HTTP $http_code)"
        fi
        
        sleep 1
    done
    
    # Final check
    if ! is_vault_sealed; then
        log "Vault is now unsealed"
        return 0
    else
        error "Failed to unseal Vault after 3 attempts"
        return 1
    fi
    
}

# Wait for Vault to be ready and unsealed
wait_for_vault() {
    log "Waiting for Vault to be ready and unsealed..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # Try multiple connection methods
        local health_response=""
        local connection_success=false
        
        # Method 1: Try direct connection with timeout
        if health_response=$(timeout 10 curl -s --connect-timeout 5 "$VAULT_ADDR/v1/sys/health" 2>/dev/null); then
            connection_success=true
            log "Connected via direct health check"
        # Method 2: Try init endpoint as fallback
        elif health_response=$(timeout 10 curl -s --connect-timeout 5 "$VAULT_ADDR/v1/sys/init" 2>/dev/null); then
            connection_success=true
            log "Connected via init endpoint"
            # Convert init response to health-like format for parsing
            if echo "$health_response" | grep -q '"initialized":true'; then
                health_response='{"sealed":false,"initialized":true}'
            fi
        # Method 3: Try basic connectivity test
        elif timeout 5 bash -c "</dev/tcp/vault/8200" >/dev/null 2>&1; then
            log "Port is open but HTTP request failed - Vault might be starting"
        else
            log "Cannot connect to Vault at $VAULT_ADDR"
            if [ $attempt -eq 5 ]; then
                debug_vault_connectivity
            fi
        fi
        
        if [ "$connection_success" = true ] && [ -n "$health_response" ]; then
            log "Connected to Vault, checking status..."
            log "Health response: $health_response"
            
            # Parse the response
            local sealed="true"
            local initialized="false"
            
            if command -v jq >/dev/null 2>&1 && echo "$health_response" | jq . >/dev/null 2>&1; then

                sealed=$(echo "$health_response" | jq -r '.sealed')
                initialized=$(echo "$health_response" | jq -r '.initialized')
            else
                # Fallback parsing
                if echo "$health_response" | grep -q '"sealed":false'; then
                    sealed="false"
                fi
                if echo "$health_response" | grep -q '"initialized":true'; then
                    initialized="true"
                fi
            fi
            
            log "Parsed - Sealed: $sealed, Initialized: $initialized"
            
            if [[ "$sealed" == "false" ]] && [[ "$initialized" == "true" ]]; then
                log "Vault is ready and unsealed!"
                return 0
            elif [[ "$initialized" == "false" ]]; then
                log "Vault is not initialized yet, waiting..."
            elif [[ "$sealed" == "true" ]]; then
                manual_unseal
                log "Vault is sealed, waiting for unseal..."
            fi
        fi
        
        log "Attempt $attempt/$max_attempts - Waiting for Vault..."
        sleep 5
        ((attempt++))
    done
    
    # Final debug attempt
    debug_vault_connectivity
    error "Vault failed to become ready after $max_attempts attempts"
}

# Authenticate with Vault
auth_vault() {
    # Check if vault init file exists
    if [ ! -f "$VAULT_INIT_FILE" ]; then
        # Try alternative locations
        local alt_locations=(
            "/tmp/vault-init/vault-init.json"
            "/vault/data/vault-init.json"
            "/tmp/vault-init.json"
            "/vault/vault-init.json"
        )
        
        local found=false
        for location in "${alt_locations[@]}"; do
            if [ -f "$location" ]; then
                VAULT_INIT_FILE="$location"
                found=true
                log "Found vault init file at: $location"
                break
            fi
        done
        
        if [ "$found" = false ]; then
            error "Vault initialization file not found. Checked locations: $VAULT_INIT_FILE ${alt_locations[*]}"
        fi
    fi
    
    log "Using vault init file: $VAULT_INIT_FILE"
    
    # Extract and validate root token
    local root_token
    if command -v jq >/dev/null 2>&1; then
        root_token=$(cat "$VAULT_INIT_FILE" | jq -r '.root_token')
    else
        # Fallback extraction
        root_token=$(grep -o '"root_token":"[^"]*"' "$VAULT_INIT_FILE" | cut -d'"' -f4)
    fi
    
    if [[ -z "$root_token" || "$root_token" == "null" ]]; then
        error "Could not extract root token from $VAULT_INIT_FILE"
    fi

    echo "========================================"
    echo "Using vault init file: $VAULT_INIT_FILE"
    echo "Using root token: $root_token"
    echo "========================================"
    export VAULT_TOKEN="$root_token"

    # Test authentication
    local auth_test
    if auth_test=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" "$VAULT_ADDR/v1/auth/token/lookup-self" 2>/dev/null); then
        if echo "$auth_test" | grep -q '"type":"service"'; then
            log "Successfully authenticated with Vault using root token"
        else
            warn "Authentication response unexpected: $auth_test"
        fi
    else
        error "Failed to authenticate with Vault using root token"
    fi
}

# Create admin policy for admin user
create_admin_policy() {
    log "Creating admin policy..."
    
    local admin_policy='
# Admin policy - full access to all paths
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Allow managing auth methods
path "auth/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Allow managing policies
path "sys/policies/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Allow managing secret engines
path "sys/mounts/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}'
    
    local response
    response=$(curl -s -w "%{http_code}" -H "X-Vault-Token: $VAULT_TOKEN" \
        -H "Content-Type: application/json" \
        -X POST "$VAULT_ADDR/v1/sys/policies/acl/admin-policy" \
        -d "{\"policy\": $(echo "$admin_policy" | jq -Rs .)}" 2>/dev/null)
    
    local http_code="${response: -3}"
    if [[ "$http_code" =~ ^(200|204)$ ]]; then
        log "✓ Created admin policy"
    else
        warn "Failed to create admin policy (HTTP $http_code)"
    fi
}

# Store secrets using Vault KV v2 API
store_secrets() {
    local path="$1"
    shift
    local -A data=()
    
    # Parse key=value pairs
    for arg in "$@"; do
        if [[ "$arg" =~ ^([^=]+)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"
            if [ -n "$value" ]; then
                data["$key"]="$value"
            fi
        fi
    done
    
    if [ ${#data[@]} -eq 0 ]; then
        warn "No valid secrets to store for path: $path"
        return 0
    fi
    
    # Build JSON data
    local json_data='{"data":{'
    local first=true
    for key in "${!data[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            json_data+=','
        fi
        # Escape special characters in values
        local escaped_value=$(echo "${data[$key]}" | sed 's/"/\\"/g' | sed 's/\\/\\\\/g')
        json_data+="\"$key\":\"${escaped_value}\""
    done
    json_data+='}}'
    
    # Store in Vault using API
    local response
    local http_code
    response=$(curl -s -w "%{http_code}" -H "X-Vault-Token: $VAULT_TOKEN" \
        -H "Content-Type: application/json" \
        -X POST "$VAULT_ADDR/v1/secret/data/$path" \
        -d "$json_data" 2>/dev/null)
    
    # Extract HTTP status code (last 3 characters)
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [[ "$http_code" == "200" ]] || [[ "$http_code" == "204" ]]; then
        log "✓ Stored ${#data[@]} secrets at: secret/$path"
    else
        warn "✗ Failed to store secrets at: secret/$path (HTTP $http_code)"
        if [ -n "$response_body" ]; then
            warn "Response: $response_body"
        fi
    fi
}

# Populate application secrets
populate_app_secrets() {
    log "Populating application secrets..."
    
    # Redis credentials
    store_secrets "app/redis" \
        "host=${REDIS_HOST:-redis}" \
        "port=${REDIS_PORT:-6379}" \
        "password=${REDIS_PASSWORD:-regex-33}"
    
    # JWT configuration
    store_secrets "app/jwt" \
        "secret=${JWT_SECRET:-regex-33-jwt-secret}" \
        "expiration=${TIME_TOKEN_EXPIRATION:-3600}"
    
    # OAuth credentials - only store if values exist
    if [ -n "${GITHUB_CLIENT_ID:-}" ] && [ -n "${GITHUB_CLIENT_SECRET:-}" ]; then
        store_secrets "app/oauth/github" \
            "client_id=${GITHUB_CLIENT_ID}" \
            "client_secret=${GITHUB_CLIENT_SECRET}" \
            "callback_url=https://ft-transcendence.com/api/auth/github/callback"
    fi
    
    if [ -n "${INTRA_CLIENT_ID:-}" ] && [ -n "${INTRA_CLIENT_SECRET:-}" ]; then
        store_secrets "app/oauth/intra" \
            "client_id=${INTRA_CLIENT_ID}" \
            "client_secret=${INTRA_CLIENT_SECRET}" \
            "callback_url=https://ft-transcendence.com/api/auth/intra/callback"
    fi
    
    if [ -n "${GOOGLE_CLIENT_ID:-}" ] && [ -n "${GOOGLE_CLIENT_SECRET:-}" ]; then
        store_secrets "app/oauth/google" \
            "client_id=${GOOGLE_CLIENT_ID}" \
            "client_secret=${GOOGLE_CLIENT_SECRET}" \
            "callback_url=https://ft-transcendence.com/api/auth/google/callback"
    fi
    
    # Email configuration
    if [ -n "${GMAIL_APP_EMAIL:-}" ] && [ -n "${GMAIL_APP_PASSWORD:-}" ]; then
        store_secrets "app/email" \
            "email=${GMAIL_APP_EMAIL}" \
            "password=${GMAIL_APP_PASSWORD}"
    fi
    
    # Rate limiting
    store_secrets "app/rate-limit" \
        "time_between_requests=${TIME_BTWN_REQUESTS:-1000}" \
        "requests_to_ban=${NUMBER_OF_REQUESTS_TO_BAN:-10}" \
        "cleanup_interval=${CLEANUP_INTERVAL:-300000}"
    
    # Application configuration
    store_secrets "app/config" \
        "name=${APP_NAME:-ft_transcendence}" \
        "env=${APP_ENV:-production}" \
        "domain=${DOMAIN:-transcendence.local}" \
        "home_page=${HOME_PAGE:-/home}" \
        "node_env=${NODE_ENV:-development}"
}

# Populate logging secrets
populate_logging_secrets() {
    log "Populating logging secrets..."
    
    # Elasticsearch credentials
    store_secrets "logging/elasticsearch" \
        "username=${ELASTIC_USERNAME:-elastic}" \
        "password=${ELASTIC_PASSWORD:-changeme}" \
        "host=${ELASTICSEARCH_HOST:-elasticsearch}" \
        "port=${ELASTICSEARCH_PORT:-9200}" \
        "cluster_name=${ELASTIC_CLUSTER_NAME:-ft-transcendence-logging}"
    
    # Kibana configuration
    store_secrets "logging/kibana" \
        "host=${KIBANA_HOST:-kibana}" \
        "port=${KIBANA_PORT:-5601}" \
        "elasticsearch_url=https://${ELASTICSEARCH_HOST:-elasticsearch}:${ELASTICSEARCH_PORT:-9200}"
    
    # Logstash configuration
    store_secrets "logging/logstash" \
        "host=${LOGSTASH_HOST:-logstash}" \
        "port=${LOGSTASH_PORT:-8080}" \
        "heap_size=${LOGSTASH_HEAP:-512m}"
    
    # ELK version
    store_secrets "logging/config" \
        "elk_version=${ELK_VERSION:-8.11.1}" \
        "elasticsearch_heap=${ELASTICSEARCH_HEAP:-1024m}" \
        "logstash_heap=${LOGSTASH_HEAP:-512m}"
}

# Populate monitoring secrets
populate_monitoring_secrets() {
    log "Populating monitoring secrets..."
    
    # Grafana credentials
    store_secrets "monitoring/grafana" \
        "admin_user=${GRAFANA_USER:-admin}" \
        "admin_password=${GRAFANA_ADMIN_PASSWORD:-admin123}"
    
    # Prometheus configuration
    store_secrets "monitoring/prometheus" \
        "retention_time=${PROMETHEUS_RETENTION_TIME:-30d}" \
        "retention_size=10GB"
    
    # Monitoring configuration
    store_secrets "monitoring/config" \
        "datacenter=${DATACENTER:-local}"
}

# Populate infrastructure secrets
populate_infrastructure_secrets() {
    log "Populating infrastructure secrets..."
    
    # Docker Swarm configuration
    store_secrets "infrastructure/swarm" \
        "manager_ip=${MANAGER_IP:-10.13.250.29}" \
        "worker1_ip=${WORKER1_IP:-10.13.249.247}" \
        "worker2_ip=${WORKER2_IP:-10.13.249.246}" \
        "ssh_user=${SSH_USER:-root}" \
        "ssh_password=${SSH_PASSWORD:-regex-33}"
    
    # Domain configuration
    store_secrets "infrastructure/domains" \
        "domain_name=${DOMAIN_NAME:-ft-transcendence.com}" \
        "app_domain=${APP_DOMAIN:-ft-transcendence.com}" \
        "logging_domain=${LOGGING_DOMAIN:-logging.ft-transcendence.com}" \
        "monitoring_domain=${MONITORING_DOMAIN:-monitoring.ft-transcendence.com}" \
        "traefik_domain=${TRAEFIK_DOMAIN:-traefik.ft-transcendence.com}" \
        "prometheus_domain=${PROMETHEUS_DOMAIN:-prometheus.ft-transcendence.com}"
    
    # Load balancer configuration
    store_secrets "infrastructure/nginx" \
        "port=${NGINX_PORT:-8080}" \
        "worker_processes=${NGINX_WORKER_PROCESSES:-auto}" \
        "worker_connections=${NGINX_WORKER_CONNECTIONS:-1024}"
    
    # Service replicas
    store_secrets "infrastructure/replicas" \
        "user_service=${USER_SERVICE_REPLICAS:-1}" \
        "chat_service=${CHAT_SERVICE_REPLICAS:-1}" \
        "frontend=${FRONTEND_REPLICAS:-1}"
}

# Create service users using API
create_service_users() {
    log "Creating service users..."
    
    local services=("app" "logging" "monitoring")
    
    for service in "${services[@]}"; do
        local password="${service}-password-$(openssl rand -hex 8)"
        
        # Create user
        local user_config='{
            "password": "'$password'",
            "policies": ["'${service}'-policy"]
        }'
        
        local response
        response=$(curl -s -w "%{http_code}" -H "X-Vault-Token: $VAULT_TOKEN" \
            -H "Content-Type: application/json" \
            -X POST "$VAULT_ADDR/v1/auth/userpass/users/$service" \
            -d "$user_config" 2>/dev/null)
        
        local http_code="${response: -3}"
        if [[ "$http_code" =~ ^(200|204)$ ]]; then
            log "✓ Created service user: $service"
            
            # Store the password in vault for reference
            store_secrets "infrastructure/service-users" "${service}-password=$password"
        else
            warn "Failed to create service user: $service (HTTP $http_code)"
            # Debug the response
            warn "Response body: ${response%???}"
        fi
    done
}

# Verify stored secrets
verify_secrets() {
    log "Verifying stored secrets..."
    
    local test_paths=("app/redis" "logging/elasticsearch" "monitoring/grafana")
    local verified_count=0
    
    for path in "${test_paths[@]}"; do
        local response
        response=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
            "$VAULT_ADDR/v1/secret/data/$path" 2>/dev/null)
        
        if echo "$response" | grep -q '"data"' && echo "$response" | grep -q '"metadata"'; then
            log "✓ Verified secrets at: secret/$path"
            ((verified_count++))
        else
            warn "✗ Failed to verify secrets at: secret/$path"
        fi
    done
    
    log "Verification complete: $verified_count/${#test_paths[@]} paths verified"
}

# Main execution
main() {
    log "Starting Vault secret population process..."
    
    # Set Vault configuration
    export VAULT_ADDR="$VAULT_ADDR"
    
    wait_for_vault
    auth_vault
    
    # Create admin policy first
    create_admin_policy
    
    # Populate secrets by category
    populate_app_secrets
    populate_logging_secrets
    populate_monitoring_secrets
    populate_infrastructure_secrets
    
    create_service_users
    
    # Verify everything worked
    verify_secrets
    
    log "Vault secret population completed successfully!"
    log "All environment variables have been securely stored in Vault"
    
    # Display summary
    echo ""
    log "=== VAULT SECRET SUMMARY ==="
    log "App secrets: secret/app/*"
    log "Logging secrets: secret/logging/*"
    log "Monitoring secrets: secret/monitoring/*"
    log "Infrastructure secrets: secret/infrastructure/*"
    echo ""
    log "Admin user: admin (password: ${VAULT_ADMIN_PASSWORD:-admin123})"
    log "Service users: app, logging, monitoring"
    echo ""
    warn "IMPORTANT: Store Vault credentials securely and rotate them regularly!"
}

# Run only if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi