#!/bin/bash

# Manual fix for Vault secrets engine
# Run these commands on the manager node

# 1. Get the root token from the running Vault container
ROOT_TOKEN=$(docker exec $(docker ps -f name=ft-vault_vault -q | head -1) cat /vault/data/vault-init.json | jq -r '.root_token')

echo "Root token: $ROOT_TOKEN"

# 2. Set environment variables
export VAULT_ADDR="http://127.0.0.1:8200"
export VAULT_TOKEN="$ROOT_TOKEN"

# 3. Check current mounts
echo "Current mounts:"
vault auth list
vault secrets list

# 4. Enable KV v2 secrets engine if not present
vault secrets enable -path=secret kv-v2

# 5. Verify the mount is working
vault kv put secret/test key=value
vault kv get secret/test
vault kv delete secret/test

# 6. Re-run the populate secrets script
docker exec -e VAULT_TOKEN="$ROOT_TOKEN" $(docker ps -f name=ft-vault_vault -q | head -1) /vault/scripts/populate-secrets.sh

echo "Manual fix completed!"
