# Vault Configuration for Docker Swarm
# File: services/devops/vault/config/vault.hcl

# Disable memory swapping
disable_mlock = true

# Storage backend - File storage
storage "file" {
  path = "/vault/data"
}

# Main listener (HTTP for simplicity in Docker Swarm)
listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_disable   = true
}

# Cluster listener for HA
listener "tcp" {
  address         = "0.0.0.0:8201"
  cluster_address = "0.0.0.0:8201"
  tls_disable     = true
}

# API configuration
api_addr = "http://vault:8200"
cluster_addr = "http://vault:8201"

# UI configuration
ui = true

# Logging
log_level = "DEBUG"
log_format = "json"

# Telemetry
telemetry {
  prometheus_retention_time = "24h"
  disable_hostname = true
  usage_gauge_period = "10m"
}