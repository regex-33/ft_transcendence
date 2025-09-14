# ===== KIBANA TEMPLATE (services/devops/vault/templates/kibana.tpl) =====
{{ with secret "secret/logging/kibana" }}
KIBANA_PORT={{ .Data.data.port }}
{{ end }}

{{ with secret "secret/logging/elasticsearch" }}
ELASTICSEARCH_HOST_PORT=https://{{ .Data.data.host }}:{{ .Data.data.port }}
ELASTIC_USERNAME={{ .Data.data.username }}
ELASTIC_PASSWORD={{ .Data.data.password }}
{{ end }}