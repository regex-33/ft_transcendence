# ===== APP-ENV TEMPLATE (services/devops/vault/templates/app-env.tpl) =====

{{ with secret "secret/app/jwt" }}
JWT_SECRET={{ .Data.data.secret }}
TIME_TOKEN_EXPIRATION={{ .Data.data.expiration }}
{{ end }}

    
{{ with secret "secret/app/config" }}
HOME_PAGE={{ .Data.data.home_page }}
DOMAIN={{ .Data.data.domain }}
NODE_ENV={{ .Data.data.node_env }}
APP_NAME={{ .Data.data.app_name }}
APP_ENV={{ .Data.data.app_env }}
{{ end }}

{{ with secret "secret/app/database" }}
DB_STORAGE={{ .Data.data.storage }}
DB_DIALECT={{ .Data.data.dialect }}
{{ end }}

{{ with secret "secret/app/rate-limit" }}
TIME_BTWN_REQUESTS={{ .Data.data.time_between_requests }}
NUMBER_OF_REQUESTS_TO_BAN={{ .Data.data.requests_to_ban }}
CLEANUP_INTERVAL={{ .Data.data.cleanup_interval }}
{{ end }}