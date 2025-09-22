# ===== DATABASE TEMPLATE (services/devops/vault/templates/database.tpl) =====
{{ with secret "secret/app/database" }}
# PostgreSQL specific environment variables
POSTGRES_HOST={{ .Data.data.host }}
POSTGRES_PORT={{ .Data.data.port }}
POSTGRES_DB={{ .Data.data.database }}
POSTGRES_USER={{ .Data.data.username }}
POSTGRES_PASSWORD={{ .Data.data.password }}

# Generic database variables for application services
DB_HOST={{ .Data.data.host }}
DB_PORT={{ .Data.data.port }}
DB_NAME={{ .Data.data.database }}
DB_USER={{ .Data.data.username }}
DB_PASSWORD={{ .Data.data.password }}
DB_DIALECT=postgres
DATABASE_URL={{ .Data.data.url }}

{{ end }}