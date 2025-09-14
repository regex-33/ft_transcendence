# ===== GRAFANA TEMPLATE (services/devops/vault/templates/grafana.tpl) =====
{{ with secret "secret/monitoring/grafana" }}
GF_SECURITY_ADMIN_USER={{ .Data.data.admin_user }}
GF_SECURITY_ADMIN_PASSWORD={{ .Data.data.admin_password }}
{{ end }}

{{ with secret "secret/logging/elasticsearch" }}
ELASTICSEARCH_USER={{ .Data.data.username }}
ELASTICSEARCH_PASSWORD={{ .Data.data.password }}
{{ end }}