# ===== LOGGING SERVICE VAULT AGENT CONFIG (vault-agent-logging.hcl) =====
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
      role_id_file_path = "/tmp/logging-role-id"
      secret_id_file_path = "/tmp/logging-secret-id"
    }
  }

  sink "file" {
    config = {
      path = "/vault/agent/data/logging-token"
      mode = 0640
    }
  }
}

cache {
  use_auto_auth_token = true
}

listener "tcp" {
  address = "127.0.0.1:8101"
  tls_disable = true
}

template {
  source = "/vault/config/elasticsearch.tpl"
  destination = "/vault/secrets/elasticsearch.env"
  perms = 0640
  command = "echo 'Elasticsearch secrets updated'"
}

template {
  source = "/vault/config/kibana.tpl"
  destination = "/vault/secrets/kibana.env"
  perms = 0640
}

template {
  source = "/vault/config/logstash.tpl"
  destination = "/vault/secrets/logstash.env"
  perms = 0640
}
