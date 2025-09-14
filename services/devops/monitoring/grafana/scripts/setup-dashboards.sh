#!/bin/bash

# Set Grafana URL and credentials from environment variables
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"
GRAFANA_USERNAME="${GRAFANA_USERNAME:-admin}"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-admin}"

echo -e "Grafana URL: $GRAFANA_URL\nUsername: $GRAFANA_USERNAME\nPassword: $GRAFANA_PASSWORD"
# Directory to store downloaded dashboards
DASHBOARD_DIR="/usr/share/grafana/dashboards"

# List of dashboard IDs to fetch
declare -A DASHBOARDS=(
  ["Node Exporter"]="1860"
  ["cAdvisor"]="14282"
  ["Elasticsearch Exporter"]="2322"
  ["Redis"]="763"
)

# Create directory for dashboards
mkdir -p "$DASHBOARD_DIR"

echo "Dashboard directory created at: $DASHBOARD_DIR"
#my current directory
echo "Current directory: $(pwd)"


# Function to download and import dashboards
# Function to download and import dashboards
fetch_and_import_dashboard() {
  local name="$1"
  local id="$2"
  local file_path="$DASHBOARD_DIR/${name// /_}.json"
  
  # Set the correct datasource name based on the dashboard name
  local datasource_name="DS_PROMETHEUS"
  if [[ "$name" == "Redis" ]]; then
    datasource_name="DS_PROM"
  fi

  echo "Fetching dashboard: $name (ID: $id)"
  curl -s -o "$file_path" "https://grafana.com/api/dashboards/$id/revisions/latest/download"

  if [[ -f "$file_path" ]]; then
    echo "Importing dashboard: $name"

    # Wrap the dashboard JSON with the correct datasource input
    jq --arg ds "$datasource_name" '{dashboard: ., overwrite: true, inputs: [{name:$ds, type:"datasource", pluginId:"prometheus", value:"Prometheus"}]}' "$file_path" > /tmp/wrapped.json
    
    # Import the wrapped dashboard into Grafana
    response=$(curl -k -s -o /dev/null -w "%{http_code}" -X POST --user "$GRAFANA_USERNAME:$GRAFANA_PASSWORD" \
      -H "Content-Type: application/json" \
      -d @/tmp/wrapped.json \
      "$GRAFANA_URL/api/dashboards/import")

    # Check the response code
    if [[ "$response" -eq 200 ]]; then
      echo "Dashboard $name imported successfully."
    else
      echo "Failed to import dashboard $name. HTTP response code: $response"
    fi

    # Clean up the temporary wrapped file
    rm /tmp/wrapped.json
  else
    echo "Failed to download dashboard: $name"
  fi
}

# Fetch and import each dashboard
for name in "${!DASHBOARDS[@]}"; do
  fetch_and_import_dashboard "$name" "${DASHBOARDS[$name]}"
done

echo "All dashboards processed."
