# ===== MONITORING SERVICE VAULT AGENT CONFIG (vault-agent-monitoring.hcl) =====
pid_file = "/vault/agent/data/pidfile"

vault {
  address = "http://vault:8200"
  tls_skip_verify = true
  retry {
    num_retries = 5
  }
}

auto_auth {
  method "approle" {
    mount_path = "auth/approle"
    config = {
      role_id_file_path = "/tmp/monitoring-role-id"
      secret_id_file_path = "/tmp/monitoring-secret-id"
    }
  }

  sink "file" {
    config = {
      path = "/vault/agent/data/monitoring-token"
      mode = 0640
    }
  }
}

cache {
  use_auto_auth_token = true
}

listener "tcp" {
  address = "127.0.0.1:8102"
  tls_disable = true
}

# Only monitoring-related templates
template {
  source = "/vault/config/elasticsearch.tpl"
  destination = "/vault/secrets/elasticsearch.env"
  perms = 0640
  command = "echo 'Elasticsearch secrets updated'"
}

template {
  source = "/vault/config/grafana.tpl"
  destination = "/vault/secrets/grafana.env"
  perms = 0640
  command = "echo 'Grafana secrets updated'"
}

template {
  source = "/vault/config/prometheus.tpl"
  destination = "/vault/secrets/prometheus.env"
  perms = 0640
  command = "echo 'Prometheus secrets updated'"
}