# ===== ELASTICSEARCH TEMPLATE (services/devops/vault/templates/elasticsearch.tpl) =====
{{ with secret "secret/logging/elasticsearch" }}
ELASTIC_USERNAME={{ .Data.data.username }}
ELASTIC_PASSWORD={{ .Data.data.password }}
ELASTICSEARCH_HOST_PORT=https://{{ .Data.data.host }}:{{ .Data.data.port }}
ELASTIC_CLUSTER_NAME={{ .Data.data.cluster_name }}
{{ end }}