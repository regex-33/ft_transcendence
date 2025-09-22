# ===== MONITORING POLICY (monitoring-policy.hcl) =====
# Policy for monitoring services (Prometheus, Grafana)
path "secret/data/monitoring/*" {
  capabilities = ["read"]
}

path "secret/metadata/monitoring/*" {
  capabilities = ["list", "read"]
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
