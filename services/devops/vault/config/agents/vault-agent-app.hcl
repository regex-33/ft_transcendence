# ===== APP SERVICE VAULT AGENT CONFIG (vault-agent-app.hcl) =====
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
      role_id_file_path = "/tmp/app-role-id"
      secret_id_file_path = "/tmp/app-secret-id"
    }
  }

  sink "file" {
    config = {
      path = "/vault/agent/data/app-token"
      mode = 0640
    }
  }
}

cache {
  use_auto_auth_token = true
}

listener "tcp" {
  address = "127.0.0.1:8100"
  tls_disable = true
}

template {
  source = "/vault/config/app-env.tpl"
  destination = "/vault/secrets/app.env"
  perms = 0640
  command = "echo 'App secrets updated'"
}

template {
  source = "/vault/config/database.tpl"
  destination = "/vault/secrets/database.env"
  perms = 0640
}

template {
  source = "/vault/config/oauth.tpl"
  destination = "/vault/secrets/oauth.env"
  perms = 0640
}