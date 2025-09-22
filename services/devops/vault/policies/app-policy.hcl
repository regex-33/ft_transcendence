# ===== APP POLICY (app-policy.hcl) =====
# Policy for main application services
path "secret/data/app/*" {
  capabilities = ["read"]
}

path "secret/metadata/app/*" {
  capabilities = ["list", "read"]
}

path "database/creds/app-db" {
  capabilities = ["read"]
}

# Add access to logging secrets for monitoring services that need them
path "secret/data/logging/elasticsearch" {
  capabilities = ["read"]
}

path "secret/metadata/logging/elasticsearch" {
  capabilities = ["read"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}