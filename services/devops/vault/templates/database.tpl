# ===== DATABASE TEMPLATE (services/devops/vault/templates/database.tpl) =====
{{ with secret "secret/app/redis" }}
REDIS_HOST={{ .Data.data.host }}
REDIS_PORT={{ .Data.data.port }}
REDIS_PASSWORD={{ .Data.data.password }}
{{ end }}