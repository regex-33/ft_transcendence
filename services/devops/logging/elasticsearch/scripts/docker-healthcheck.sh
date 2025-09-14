#!/bin/bash
set -eo pipefail

host="$(hostname --ip-address || echo '127.0.0.1')"


# Function to install index templates
install_templates() {
    echo "Installing index templates..."
    for template in /usr/share/elasticsearch/config/templates/*.json; do
        if [[ -f "$template" ]]; then
            template_name=$(basename "$template" .json)
            echo "Installing template: $template_name"
            
            echo -e "--------------------------------"
            echo -e "--------------------------------"
            # Try with authentication first, fallback to no auth
            if ! curl -s -f -u "elastic:${ELASTIC_PASSWORD}" -X PUT "localhost:9200/_index_template/$template_name" \
                -H "Content-Type: application/json" \
                -d @"$template"; then


                curl -X PUT "localhost:9200/_index_template/$template_name" \
                    -H "Content-Type: application/json" \
                    -d @"$template" || echo "Failed to install template: $template_name"
            fi
            echo -e "--------------------------------"
            echo -e "--------------------------------"
        fi
    done
}


if health="$(curl -fsSL "https://$ELASTIC_USERNAME:$ELASTIC_PASSWORD@$host:$ELASTICSEARCH_PORT/_cat/health?h=status" --insecure)"; then
	health="$(echo "$health" | sed -r 's/^[[:space:]]+|[[:space:]]+$//g')" # trim whitespace (otherwise we'll have "green ")
	if [ "$health" = 'green' ] || [ "$health" = "yellow" ]; then
		install_templates
		exit 0
	fi
	echo >&2 "unexpected health status: $health"
fi


exit 0