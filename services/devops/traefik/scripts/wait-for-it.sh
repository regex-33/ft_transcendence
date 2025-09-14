#!/bin/bash

# Wait for Elasticsearch to be healthy

until curl --silent --fail -u "${ELASTIC_USERNAME}:${ELASTIC_PASSWORD}" "https://${ELASTICSEARCH_HOSTS}:9200/_cluster/health?wait_for_status=green&timeout=30s&pretty" -k; do
  echo "Waiting for Elasticsearch to be ready..."
  sleep 5
done

# Execute the command passed to the script
exec "$@"