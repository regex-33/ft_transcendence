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


# # ===== MONITORING POLICY (monitoring-policy.hcl) =====
# # Policy for monitoring services (Prometheus, Grafana)
# path "secret/data/monitoring/*" {
#   capabilities = ["read"]
# }

# path "secret/metadata/monitoring/*" {
#   capabilities = ["list", "read"]
# }

# # Add access to logging secrets for monitoring services that need them
# path "secret/data/logging/elasticsearch" {
#   capabilities = ["read"]
# }

# path "secret/metadata/logging/elasticsearch" {
#   capabilities = ["list", "read"]
# }

# # Add broader access if needed for monitoring to access all logging secrets
# path "secret/data/logging/*" {
#   capabilities = ["read"]
# }

# path "secret/metadata/logging/*" {
#   capabilities = ["list", "read"]
# }

# path "auth/token/lookup-self" {
#   capabilities = ["read"]
# }

# path "auth/token/renew-self" {
#   capabilities = ["update"]
# }

# # Add sys capabilities for health checks
# path "sys/health" {
#   capabilities = ["read"]
# }

# path "sys/internal/ui/mounts/*" {
#   capabilities = ["read"]
# }