#!/bin/bash
set -e

# Load index templates
if [ -d "/usr/share/elasticsearch/index-templates" ]; then
    echo "Loading index templates..."
    for template in /usr/share/elasticsearch/index-templates/*.json; do
        if [ -f "$template" ]; then
            echo "Loading template: $template"
            curl -X PUT "localhost:9200/_index_template/$(basename "$template" .json)" \
                 -H "Content-Type: application/json" \
                 -d "@$template" || true
        fi
    done
fi

# Start Elasticsearch
exec /usr/local/bin/docker-entrypoint.sh "$@"