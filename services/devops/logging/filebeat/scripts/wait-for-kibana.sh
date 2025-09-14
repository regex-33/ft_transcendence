#!/bin/bash

KIBANA_URL=${KIBANA_URL:-https://kibana:5601}
KIBANA_USERNAME=${KIBANA_USERNAME:-elastic}
KIBANA_PASSWORD=${KIBANA_PASSWORD:-changeme}

echo "Waiting for Kibana to be ready at $KIBANA_URL..."

while true; do
  STATUS=$(curl -s -u "$KIBANA_USERNAME:$KIBANA_PASSWORD" -k "$KIBANA_URL/api/status" | jq -r '.status.overall.state')
  if [ "$STATUS" == "green" ]; then
    echo "Kibana is ready!"
    break
  fi
  echo "Kibana is not ready yet. Retrying in 5 seconds..."
  sleep 5
done