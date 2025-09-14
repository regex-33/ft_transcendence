# ===== LOGSTASH TEMPLATE (services/devops/vault/templates/logstash.tpl) =====
{{ with secret "secret/logging/logstash" }}
LOGSTASH_HOST={{ .Data.data.host }}
LOGSTASH_PORT={{ .Data.data.port }}
LS_JAVA_OPTS="-Xmx{{ .Data.data.heap_size }} -Xms{{ .Data.data.heap_size }}"
{{ end }}

{{ with secret "secret/logging/elasticsearch" }}
ELASTIC_USERNAME={{ .Data.data.username }}
ELASTIC_PASSWORD={{ .Data.data.password }}
ELASTICSEARCH_HOST_PORT=https://{{ .Data.data.host }}:{{ .Data.data.port }}
{{ end }}