#!/bin/bash

# vault-integration.sh - Integrate Vault with Docker Swarm cluster

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
echo "Script Directory: $SCRIPT_DIR"
echo "Project Root: $PROJECT_ROOT"

# Configuration
VAULT_VERSION="1.20.2"
INSTALL_DIR="/usr/local/bin"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; exit 1; }
info() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"; }

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    source "$PROJECT_ROOT/.env"
else
    error ".env file not found in project root"
fi

# Detect OS and architecture
detect_platform() {
    local os=""
    local arch=""
    
    case "$(uname -s)" in
        Linux*)   os="linux" ;;
        Darwin*)  os="darwin" ;;
        CYGWIN*)  os="windows" ;;
        MINGW*)   os="windows" ;;
        *)        error "Unsupported operating system: $(uname -s)" ;;
    esac
    
    case "$(uname -m)" in
        x86_64)   arch="amd64" ;;
        arm64)    arch="arm64" ;;
        aarch64)  arch="arm64" ;;
        armv7l)   arch="arm" ;;
        *)        error "Unsupported architecture: $(uname -m)" ;;
    esac
    
    echo "${os}_${arch}"
}

# Check if Vault is already installed
check_existing_installation() {
    if command -v vault &> /dev/null; then
        local current_version=$(vault version | head -n1 | awk '{print $2}' | sed 's/v//')
        log "Vault is already installed (version: $current_version)"
        
        if [[ "$current_version" == "$VAULT_VERSION" ]]; then
            log "Vault is up to date"
            return 0
        else
            warn "Vault version mismatch. Current: $current_version, Required: $VAULT_VERSION"
            return 1
        fi
    fi
    
    return 1
}

# Download and install Vault
install_vault() {
    log "Installing HashiCorp Vault v$VAULT_VERSION..."
    
    local platform=$(detect_platform)
    local download_url="https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_${platform}.zip"
    local temp_dir=$(mktemp -d)
    local zip_file="$temp_dir/vault.zip"
    
    log "Downloading Vault from: $download_url"
    
    if command -v curl &> /dev/null; then
        curl -sSL "$download_url" -o "$zip_file"
    elif command -v wget &> /dev/null; then
        wget -q "$download_url" -O "$zip_file"
    else
        error "Neither curl nor wget is available. Please install one of them."
    fi
    
    # Verify download
    if [[ ! -f "$zip_file" ]]; then
        error "Failed to download Vault"
    fi
    
    # Extract and install
    log "Extracting Vault..."
    unzip -q "$zip_file" -d "$temp_dir"
    
    # Install binary
    if [[ -w "$INSTALL_DIR" ]]; then
        cp "$temp_dir/vault" "$INSTALL_DIR/"
    else
        log "Installing Vault to $INSTALL_DIR (requires sudo)..."
        sudo cp "$temp_dir/vault" "$INSTALL_DIR/"
    fi
    
    # Set permissions
    chmod +x "$INSTALL_DIR/vault"
    
    # Clean up
    rm -rf "$temp_dir"
    
    log "Vault installed successfully to $INSTALL_DIR/vault"
}


# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || error "Docker is required"
    command -v sshpass >/dev/null 2>&1 || error "sshpass is required"
    command -v openssl >/dev/null 2>&1 || error "openssl is required"
    
    if [[ -z "${MANAGER_IP:-}" ]]; then
        error "MANAGER_IP not set in .env"
    fi
    
    log "Prerequisites check passed"
}

# Generate TLS certificates for Vault
generate_vault_certs() {
    log "Generating TLS certificates for Vault..."
    
    local cert_dir="$PROJECT_ROOT/services/devops/logging/secrets/vault-certs"
    mkdir -p "$cert_dir"
    
    # Generate CA
    if [[ ! -f "$cert_dir/vault-ca.key" ]]; then
        openssl genrsa -out "$cert_dir/vault-ca.key" 4096
        openssl req -new -x509 -days 365 -key "$cert_dir/vault-ca.key" \
            -out "$cert_dir/vault-ca.crt" \
            -subj "/CN=Vault CA/O=ft_transcendence/C=US"
        log "Generated Vault CA certificate"
    fi
    
    # Generate Vault server certificate
    if [[ ! -f "$cert_dir/vault.key" ]]; then
        openssl genrsa -out "$cert_dir/vault.key" 4096
        openssl req -new -key "$cert_dir/vault.key" \
            -out "$cert_dir/vault.csr" \
            -subj "/CN=vault.ft-transcendence.com/O=ft_transcendence/C=US"
        
        # Create extensions file
        cat > "$cert_dir/vault.ext" << EOF
[v3_req]
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = vault
DNS.2 = vault.ft-transcendence.com
DNS.3 = localhost
IP.1 = 127.0.0.1
IP.2 = ${MANAGER_IP}
EOF

        echo "Creating Vault server certificate..."
        openssl x509 -req -in "$cert_dir/vault.csr" \
            -CA "$cert_dir/vault-ca.crt" -CAkey "$cert_dir/vault-ca.key" \
            -CAcreateserial -out "$cert_dir/vault.crt" \
            -days 365 -extensions v3_req -extfile "$cert_dir/vault.ext"
        echo "Vault server certificate created successfully."

        log "Generated Vault server certificate"
    fi
    
    # Set proper permissions
    chmod 640 "$cert_dir"/*.key
    chmod 644 "$cert_dir"/*.crt
}

# Create Docker secrets for Vault
create_vault_secrets() {
    log "Creating Docker secrets for Vault..."

    local cert_dir="$PROJECT_ROOT/services/devops/logging/secrets/vault-certs"

    # Check if we're on the manager node
    if ! docker node ls >/dev/null 2>&1; then
        error "Not connected to Docker Swarm manager"
    fi
    
    # Create TLS secrets
    echo "Creating vault-tls-cert secret..."
    if ! docker secret inspect vault-tls-cert >/dev/null 2>&1; then
        echo "$cert_dir/vault.crt"
        docker secret create vault-tls-cert "$cert_dir/vault.crt"
        log "Created vault-tls-cert secret"
    fi
    echo "vault-tls-cert secret created successfully."

    echo "Creating vault-tls-key secret..."
    if ! docker secret inspect vault-tls-key >/dev/null 2>&1; then
        docker secret create vault-tls-key "$cert_dir/vault.key"
        log "Created vault-tls-key secret"
    fi
    echo "vault-tls-key secret created successfully."
}

# Step 2: Create Vault configs
create_vault_configs() {
    log "Creating Vault agent configurations..."
    
    local configs=(
        "vault-agent-app-config:services/devops/vault/config/agents/vault-agent-app.hcl"
        "vault-agent-logging-config:services/devops/vault/config/agents/vault-agent-logging.hcl"
        "vault-agent-monitoring-config:services/devops/vault/config/agents/vault-agent-monitoring.hcl"
    )
    
    for config_spec in "${configs[@]}"; do
        local config_name="${config_spec%%:*}"
        local config_path="${config_spec##*:}"
        
        if [ -f "$config_path" ]; then
            if ! docker config inspect "$config_name" >/dev/null 2>&1; then
                docker config create "$config_name" "$config_path"
                log "Created config: $config_name"
            else
                log "Config already exists: $config_name"
            fi
        else
            warn "Config file not found: $config_path"
        fi
    done
}
# Step 1: Create external networks
create_networks() {
    log "Creating external networks..."
    
    local networks=("vault-network" "app-network" "logging-network" "monitoring-network" "traefik-public")
    
    for network in "${networks[@]}"; do
        if ! docker network inspect "$network" >/dev/null 2>&1; then
            docker network create --driver overlay "$network"
            log "Created network: $network"
        else
            log "Network already exists: $network"
        fi
    done
}

# Step 3: Deploy Vault stack and wait for initialization
deploy_vault() {
    log "Deploying Vault stack..."
    
    log "Removing existing ft-vault stack..."
    sudo docker stack rm ft-vault
    sleep 10

    log "Deploying ft-vault stack..."
    docker stack deploy -c stacks/docker-compose.vault.yml ft-vault
    
    log "Waiting for Vault initialization to complete..."
    
    local max_attempts=120
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # Check if vault-secrets-creator service has completed successfully
        local task_state=$(docker service ps ft-vault_vault-secrets-creator --format "{{.CurrentState}}" --no-trunc | head -1)
        
        if echo "$task_state" | grep -q "Complete"; then
            log "Vault initialization and Docker secrets creation completed!"
            return 0
        elif echo "$task_state" | grep -q "Failed"; then
            warn "Vault secrets creator failed. Check logs: docker service logs ft-vault_vault-secrets-creator"
            return 1
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            log "Still waiting for Vault initialization... (attempt $attempt/$max_attempts)"
        fi
        
        sleep 5
        ((attempt++))
    done
    
    warn "Vault initialization did not complete within expected time"
    return 1
}

# Step 4: Verify Docker secrets were created
verify_secrets() {
    log "Verifying Docker secrets were created..."
    
    local required_secrets=("app-role-id" "app-secret-id" "logging-role-id" "logging-secret-id" "monitoring-role-id" "monitoring-secret-id")
    
    for secret in "${required_secrets[@]}"; do
        if docker secret inspect "$secret" >/dev/null 2>&1; then
            log "✓ Secret exists: $secret"
        else
            warn "✗ Secret missing: $secret"
            return 1
        fi
    done
    
    log "All AppRole secrets verified successfully!"
}

# Wait for Vault to be ready
wait_for_vault() {
    log "Waiting for Vault to be ready..."
    
    local max_attempts=60
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -k -s "https://${MANAGER_IP}:8200/v1/sys/health" >/dev/null 2>&1; then
            log "Vault is ready!"
            return 0
        fi
        
        info "Attempt $attempt/$max_attempts - Waiting for Vault..."
        sleep 5
        ((attempt++))
    done
    
    error "Vault failed to become ready after $max_attempts attempts"
}

# Initialize Vault
initialize_vault() {
    log "Checking if Vault needs initialization..."
    
    # Check if Vault is already initialized
    local vault_status=$(curl -k -s "https://${MANAGER_IP}:8200/v1/sys/init" | jq -r '.initialized')
    
    if [[ "$vault_status" == "true" ]]; then
        warn "Vault is already initialized"
        return 0
    fi
    
    log "Initializing Vault..."
    docker service logs ft-vault_vault-init
}

# Update docker-compose files to use Vault
update_compose_files() {
    log "Information: Update your docker-compose files manually to use Vault secrets"
    
    info "You need to:"
    info "1. Replace hardcoded passwords with Vault agent templates"
    info "2. Add vault-agent services to your stacks"
    info "3. Update service dependencies to include vault agents"
    info "4. Modify environment variable sourcing to use Vault templates"
}

# Show access information
show_access_info() {
    log "Vault integration completed!"
    
    echo
    echo "==============================="
    echo "    VAULT ACCESS INFORMATION"
    echo "==============================="
    echo
    echo "Vault UI: https://vault.ft-transcendence.com"
    echo "Vault API: https://${MANAGER_IP}:8200"
    echo
    echo "Add to your /etc/hosts:"
    echo "${MANAGER_IP}    vault.ft-transcendence.com"
    echo
    warn "Check Vault initialization logs:"
    echo "docker service logs ft-vault_vault-init"
    echo
    warn "Get root token and unseal keys from:"
    echo "docker exec \$(docker ps -f name=ft-vault_vault -q | head -1) cat /vault/data/vault-init.json"
    echo
}

# Main function
main() {
    log "Starting Vault integration with Docker Swarm..."

    log "Setting up Vault client..."
    
    if ! check_existing_installation; then
        install_vault
    fi
    
    check_prerequisites
    generate_vault_certs
    create_vault_secrets

    create_vault_configs
    create_networks
    
    if deploy_vault && verify_secrets; then
        # wait_for_vault
        log "Deployment completed successfully!"
    else
        warn "Deployment failed during Vault setup. Check service logs for details."
        exit 1
    fi
    # wait_for_vault
    initialize_vault
    # update_compose_files
    show_access_info
    
    log "Vault integration completed successfully!"
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Integrate HashiCorp Vault with Docker Swarm cluster"
    echo
    echo "Commands:"
    echo "  deploy     Deploy Vault stack (default)"
    echo "  certs      Generate certificates only"
    echo "  secrets    Create Docker secrets only"
    echo "  init       Initialize Vault only"
    echo "  status     Show Vault status"
    echo "  help       Show this help"
    echo
}

# Parse command
case "${1:-deploy}" in
    deploy)
        main
        ;;
    certs)
        check_prerequisites
        generate_vault_certs
        ;;
    secrets)
        check_prerequisites
        create_vault_secrets
        ;;
    init)
        wait_for_vault
        initialize_vault
        ;;
    status)
        if curl -k -s "https://${MANAGER_IP}:8200/v1/sys/health" >/dev/null 2>&1; then
            echo "Vault is running and accessible"
        else
            echo "Vault is not accessible"
        fi
        ;;
    help)
        show_usage
        ;;
    *)
        error "Unknown command: $1"
        ;;
esac