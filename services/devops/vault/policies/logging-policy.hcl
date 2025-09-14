# ===== LOGGING POLICY (logging-policy.hcl) =====
# Policy for logging services (ELK stack)
path "secret/data/logging/*" {
  capabilities = ["read"]
}

path "secret/metadata/logging/*" {
  capabilities = ["list", "read"]
}

path "database/creds/logging-db" {
  capabilities = ["read"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}