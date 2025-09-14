# ===== PROMETHEUS TEMPLATE (services/devops/vault/templates/prometheus.tpl) =====
{{ with secret "secret/monitoring/prometheus" }}
PROMETHEUS_RETENTION_TIME={{ .Data.data.retention_time }}
{{ end }}