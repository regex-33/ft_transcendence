#!/bin/bash

# Import Kibana dashboards
host="${KIBANA_HOST:-localhost}"
port="${KIBANA_PORT:-5601}"
GREEN='\033[0;32m'
NC='\033[0m' # No Color
RED='\033[0;31m'
YELLOW='\033[0;33m'

source /vault/secrets/elasticsearch.env

ELASTIC_USERNAME="${ELASTIC_USERNAME:-elastic}"
ELASTIC_PASSWORD="${ELASTIC_PASSWORD:-changeme}"

#echo "User name : $ELASTIC_USERNAME"
#echo "User name : $ELASTIC_PASSWORD"

if [[ ! -d "/dashboards" ]]; then
  echo "Error: /dashboards directory does not exist."
  exit 1
fi

for dashboard in /dashboards/*.ndjson; do
    echo -e "${YELLOW}Importing dashboard: $dashboard${NC}"
    response=$(curl -s -k -o /dev/null -w "%{http_code}" -X POST "https://$host:$port/api/saved_objects/_import" -H "kbn-xsrf: true" --form  "file=@${dashboard}"  -u "${ELASTIC_USERNAME}:${ELASTIC_PASSWORD}")

    if [[ "$response" -ne 200 ]]; then
      echo -e "${RED}Failed to import dashboard: $dashboard (HTTP $response)${NC}"
    else
      echo -e "${GREEN}Successfully imported dashboard: $dashboard${NC}"
    fi
done

