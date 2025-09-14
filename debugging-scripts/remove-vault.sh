#!/bin/bash

# complete-vault-removal.sh - Remove all Vault-related data and services
# Run this script on the Docker Swarm manager node

set -euo pipefail

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
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Confirmation prompt
confirm_removal() {
    echo -e "${RED}WARNING: This will completely remove ALL Vault-related data!${NC}"
    echo "This includes:"
    echo "- Vault Docker stack and services"
    echo "- All Vault volumes and data"
    echo "- Vault Docker secrets"
    echo "- Vault Docker configs"
    echo "- Vault networks"
    echo "- Vault images"
    echo "- Local Vault certificates"
    echo ""
    read -p "Are you absolutely sure? Type 'REMOVE_VAULT' to confirm: " confirmation
    
    if [[ "$confirmation" != "REMOVE_VAULT" ]]; then
        echo "Operation cancelled."
        exit 0
    fi
}

# Remove Vault stack
remove_vault_stack() {
    log "Removing Vault stack..."
    
    if docker stack ls --format "{{.Name}}" | grep -q "^ft-vault$"; then
        docker stack rm ft-vault
        log "Vault stack removal initiated"
        
        # Wait for stack to be fully removed
        info "Waiting for stack to be completely removed..."
        while docker stack ls --format "{{.Name}}" | grep -q "^ft-vault$"; do
            sleep 2
            echo -n "."
        done
        echo ""
        log "Vault stack completely removed"
    else
        warn "Vault stack not found"
    fi
}

# Remove Vault Docker secrets
remove_vault_secrets() {
    log "Removing Vault Docker secrets..."
    
    local vault_secrets=(
        "app-role-id"
        "app-secret-id"
        "logging-role-id"
        "logging-secret-id" 
        "monitoring-role-id"
        "monitoring-secret-id"
        "vault-tls-cert"
        "vault-tls-key"
        "vault-ca-cert"
    )
    
    for secret in "${vault_secrets[@]}"; do
        if docker secret inspect "$secret" >/dev/null 2>&1; then
            docker secret rm "$secret"
            log "Removed secret: $secret"
        else
            info "Secret not found: $secret"
        fi
    done
}

# Remove Vault Docker configs
remove_vault_configs() {
    log "Removing Vault Docker configs..."
    
    local vault_configs=(
        "vault-agent-app-config"
        "vault-agent-logging-config"
        "vault-agent-monitoring-config"
        "vault-config"
        "vault-policies"
    )
    
    for config in "${vault_configs[@]}"; do
        if docker config inspect "$config" >/dev/null 2>&1; then
            docker config rm "$config"
            log "Removed config: $config"
        else
            info "Config not found: $config"
        fi
    done
}

# Remove Vault volumes
remove_vault_volumes() {
    log "Removing Vault volumes..."
    
    # Get all vault-related volumes
    local vault_volumes=$(docker volume ls --format "{{.Name}}" | grep -E "(vault|ft-vault)" || true)
    
    if [[ -n "$vault_volumes" ]]; then
        echo "$vault_volumes" | while read -r volume; do
            if [[ -n "$volume" ]]; then
                docker volume rm "$volume" 2>/dev/null || warn "Could not remove volume: $volume"
                log "Removed volume: $volume"
            fi
        done
    else
        info "No Vault volumes found"
    fi
}

# Remove Vault networks
remove_vault_networks() {
    log "Removing Vault networks..."
    
    local vault_networks=(
        "vault-network"
        "ft-vault_default"
    )
    
    for network in "${vault_networks[@]}"; do
        if docker network inspect "$network" >/dev/null 2>&1; then
            # Check if network has any containers attached
            local containers=$(docker network inspect "$network" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || true)
            
            if [[ -n "$containers" ]]; then
                warn "Network $network has containers attached: $containers"
                warn "Network will be removed after containers are stopped"
            fi
            
            docker network rm "$network" 2>/dev/null || warn "Could not remove network: $network"
            log "Removed network: $network"
        else
            info "Network not found: $network"
        fi
    done
}

# Remove Vault images
remove_vault_images() {
    log "Removing Vault images..."
    
    local vault_images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(vault|ft_transcendence/vault)" || true)
    
    if [[ -n "$vault_images" ]]; then
        echo "$vault_images" | while read -r image; do
            if [[ -n "$image" ]]; then
                docker rmi "$image" -f 2>/dev/null || warn "Could not remove image: $image"
                log "Removed image: $image"
            fi
        done
    else
        info "No Vault images found"
    fi
}

# Remove local Vault certificates and files
remove_vault_files() {
    log "Removing local Vault certificates and files..."
    
    local vault_dirs=(
        "./services/devops/logging/secrets/vault-certs"
        "./services/devops/vault/data"
        "./services/devops/vault/logs"
        "./services/devops/vault/config/data"
    )
    
    for dir in "${vault_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            rm -rf "$dir"
            log "Removed directory: $dir"
        else
            info "Directory not found: $dir"
        fi
    done
    
    # Remove any vault-init files
    local vault_files=(
        "./vault-init.json"
        "/tmp/vault-init.json"
        "./services/devops/logging/secrets/vault-init.json"
    )
    
    for file in "${vault_files[@]}"; do
        if [[ -f "$file" ]]; then
            rm -f "$file"
            log "Removed file: $file"
        else
            info "File not found: $file"
        fi
    done
}

# Clean up any running Vault containers (fallback)
cleanup_vault_containers() {
    log "Cleaning up any remaining Vault containers..."
    
    local vault_containers=$(docker ps -a --format "{{.Names}}" | grep -E "(vault|ft-vault)" || true)
    
    if [[ -n "$vault_containers" ]]; then
        echo "$vault_containers" | while read -r container; do
            if [[ -n "$container" ]]; then
                docker stop "$container" 2>/dev/null || true
                docker rm "$container" 2>/dev/null || true
                log "Removed container: $container"
            fi
        done
    else
        info "No Vault containers found"
    fi
}

# Remove Vault CLI if installed
remove_vault_cli() {
    log "Checking for Vault CLI..."
    
    if command -v vault >/dev/null 2>&1; then
        local vault_path=$(which vault)
        warn "Vault CLI found at: $vault_path"
        read -p "Remove Vault CLI? (y/n): " remove_cli
        
        if [[ "$remove_cli" =~ ^[Yy]$ ]]; then
            sudo rm -f "$vault_path" 2>/dev/null || rm -f "$vault_path" 2>/dev/null || warn "Could not remove Vault CLI"
            log "Vault CLI removed"
        fi
    else
        info "Vault CLI not found"
    fi
}

# Verify removal
verify_removal() {
    log "Verifying Vault removal..."
    
    echo ""
    info "=== VERIFICATION RESULTS ==="
    
    # Check stacks
    local stacks=$(docker stack ls --format "{{.Name}}" | grep -E "(vault|ft-vault)" || true)
    if [[ -n "$stacks" ]]; then
        warn "Remaining Vault stacks: $stacks"
    else
        log "✓ No Vault stacks found"
    fi
    
    # Check services
    local services=$(docker service ls --format "{{.Name}}" | grep -E "(vault|ft-vault)" || true)
    if [[ -n "$services" ]]; then
        warn "Remaining Vault services: $services"
    else
        log "✓ No Vault services found"
    fi
    
    # Check containers
    local containers=$(docker ps -a --format "{{.Names}}" | grep -E "(vault|ft-vault)" || true)
    if [[ -n "$containers" ]]; then
        warn "Remaining Vault containers: $containers"
    else
        log "✓ No Vault containers found"
    fi
    
    # Check volumes
    local volumes=$(docker volume ls --format "{{.Name}}" | grep -E "(vault|ft-vault)" || true)
    if [[ -n "$volumes" ]]; then
        warn "Remaining Vault volumes: $volumes"
    else
        log "✓ No Vault volumes found"
    fi
    
    # Check secrets
    local secrets=$(docker secret ls --format "{{.Name}}" | grep -E "(vault|role-id|secret-id)" || true)
    if [[ -n "$secrets" ]]; then
        warn "Remaining Vault secrets: $secrets"
    else
        log "✓ No Vault secrets found"
    fi
    
    # Check networks
    local networks=$(docker network ls --format "{{.Name}}" | grep -E "(vault|ft-vault)" || true)
    if [[ -n "$networks" ]]; then
        warn "Remaining Vault networks: $networks"
    else
        log "✓ No Vault networks found"
    fi
    
    # Check images
    local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(vault|ft_transcendence/vault)" || true)
    if [[ -n "$images" ]]; then
        warn "Remaining Vault images: $images"
    else
        log "✓ No Vault images found"
    fi
    
    echo ""
    log "Vault removal verification completed"
}

# Main execution
main() {
    log "Starting complete Vault removal..."
    
    # Check if we're on a swarm manager
    if ! docker node ls >/dev/null 2>&1; then
        error "This script must be run on a Docker Swarm manager node"
        exit 1
    fi
    
    confirm_removal
    
    log "Proceeding with Vault removal..."
    
    remove_vault_stack
    sleep 5
    cleanup_vault_containers
    remove_vault_secrets
    remove_vault_configs
    remove_vault_volumes
    remove_vault_networks
    remove_vault_images
    remove_vault_files
    #remove_vault_cli
    
    # Final cleanup
    docker system prune -f --volumes 2>/dev/null || true
    
    verify_removal
    
    log "Complete Vault removal finished!"
    warn "You may want to reboot the system to ensure all resources are freed"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Completely remove all Vault-related data from Docker Swarm"
    echo ""
    echo "Options:"
    echo "  --force    Skip confirmation prompt"
    echo "  --help     Show this help"
    echo ""
}

# Parse arguments
case "${1:-}" in
    --force)
        main
        ;;
    --help)
        show_usage
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac
