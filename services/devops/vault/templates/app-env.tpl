# ===== APP-ENV TEMPLATE (services/devops/vault/templates/app-env.tpl) =====
{{ with secret "secret/app/database" }}
POSTGRES_HOST={{ .Data.data.host }}
POSTGRES_PORT={{ .Data.data.port }}
POSTGRES_DB={{ .Data.data.database }}
POSTGRES_USER={{ .Data.data.username }}
POSTGRES_PASSWORD={{ .Data.data.password }}
{{ end }}

{{ with secret "secret/app/redis" }}
REDIS_HOST={{ .Data.data.host }}
REDIS_PORT={{ .Data.data.port }}
REDIS_PASSWORD={{ .Data.data.password }}
{{ end }}

{{ with secret "secret/app/jwt" }}
JWT_SECRET={{ .Data.data.secret }}
TIME_TOKEN_EXPIRATION={{ .Data.data.expiration }}
{{ end }}

{{ with secret "secret/app/rate-limit" }}
TIME_BTWN_REQUESTS={{ .Data.data.time_between_requests }}
NUMBER_OF_REQUESTS_TO_BAN={{ .Data.data.requests_to_ban }}
CLEANUP_INTERVAL={{ .Data.data.cleanup_interval }}
{{ end }}