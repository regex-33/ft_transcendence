#!/bin/bash

# fix-vault-policy.sh - Fix the monitoring policy in Vault

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; exit 1; }

# Get vault container
VAULT_CONTAINER=$(docker ps -f name=ft-vault_vault -q | head -1)

if [ -z "$VAULT_CONTAINER" ]; then
    error "Vault container not found"
fi

log "Found Vault container: $VAULT_CONTAINER"

# Get root token
log "Retrieving root token..."
ROOT_TOKEN=$(docker exec $VAULT_CONTAINER cat /tmp/vault-init/vault-init.json 2>/dev/null | jq -r '.root_token' 2>/dev/null)

if [ -z "$ROOT_TOKEN" ] || [ "$ROOT_TOKEN" = "null" ]; then
    # Try alternative location
    ROOT_TOKEN=$(docker exec $VAULT_CONTAINER cat /vault/data/vault-init.json 2>/dev/null | jq -r '.root_token' 2>/dev/null || echo "")
fi

if [ -z "$ROOT_TOKEN" ] || [ "$ROOT_TOKEN" = "null" ]; then
    error "Could not retrieve root token from Vault container"
fi

log "Root token retrieved successfully"

# Create the policy file inside the container
log "Creating monitoring policy file in container..."
docker exec $VAULT_CONTAINER sh -c 'cat > /tmp/monitoring-policy.hcl << EOF
# ===== MONITORING POLICY (monitoring-policy.hcl) =====
# Policy for monitoring services (Prometheus, Grafana)

# Access to monitoring secrets
path "secret/data/monitoring/*" {
  capabilities = ["read"]
}

path "secret/metadata/monitoring/*" {
  capabilities = ["list", "read"]
}

# Access to logging secrets for monitoring services that need them
path "secret/data/logging/*" {
  capabilities = ["read"]
}

path "secret/metadata/logging/*" {
  capabilities = ["list", "read"]
}

# Token management
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

# System health checks
path "sys/health" {
  capabilities = ["read"]
}

path "sys/internal/ui/mounts/*" {
  capabilities = ["read"]
}
EOF'

# Apply the policy using the file
log "Applying monitoring policy to Vault..."
docker exec -e VAULT_TOKEN=$ROOT_TOKEN -e VAULT_ADDR=http://127.0.0.1:8200 $VAULT_CONTAINER \
    vault policy write monitoring-policy /tmp/monitoring-policy.hcl

if [ $? -eq 0 ]; then
    log "✓ Successfully updated monitoring policy"
else
    error "Failed to update monitoring policy"
fi

# Verify the policy was applied
log "Verifying policy was applied..."
docker exec -e VAULT_TOKEN=$ROOT_TOKEN -e VAULT_ADDR=http://127.0.0.1:8200 $VAULT_CONTAINER \
    vault policy read monitoring-policy

# Update the AppRole to ensure it has the correct policy
log "Updating monitoring AppRole with correct policy..."
docker exec -e VAULT_TOKEN=$ROOT_TOKEN -e VAULT_ADDR=http://127.0.0.1:8200 $VAULT_CONTAINER \
    vault write auth/approle/role/monitoring \
    token_policies="monitoring-policy" \
    token_ttl=1h \
    token_max_ttl=4h \
    bind_secret_id=true

log "✓ AppRole updated successfully"

# Generate new secret-id for the monitoring role
log "Generating new secret-id for monitoring role..."
NEW_SECRET_ID=$(docker exec -e VAULT_TOKEN=$ROOT_TOKEN -e VAULT_ADDR=http://127.0.0.1:8200 $VAULT_CONTAINER \
    vault write -field=secret_id auth/approle/role/monitoring/secret-id)

if [ -n "$NEW_SECRET_ID" ]; then
    log "✓ New secret-id generated: ${NEW_SECRET_ID:0:8}..."
    
    # Update Docker secret
    log "Updating Docker secret with new secret-id..."
    echo "$NEW_SECRET_ID" | docker secret create monitoring-secret-id-new -
    
    # Remove old secret and rename new one (requires service update)
    warn "You'll need to update the monitoring stack to use the new secret"
    warn "Or restart the vault-agent-monitoring service to pick up the new credentials"
else
    error "Failed to generate new secret-id"
fi

# Force restart of monitoring vault agent
log "Restarting monitoring vault agent..."
docker service update --force ft-monitoring_vault-agent-monitoring 2>/dev/null || \
    warn "Could not restart monitoring vault agent service (service might not exist yet)"

log "✓ Policy fix completed successfully!"
log ""
log "Next steps:"
log "1. Check vault agent logs: docker service logs ft-monitoring_vault-agent-monitoring"
log "2. Verify secrets are being created: docker exec <container> ls -la /vault/secrets/"
log "3. If still having issues, restart the entire monitoring stack"
