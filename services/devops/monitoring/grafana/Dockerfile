FROM grafana/grafana:latest

# Install plugins
RUN grafana-cli plugins install grafana-piechart-panel
RUN grafana-cli plugins install grafana-worldmap-panel
RUN grafana-cli plugins install redis-datasource

# Copy configuration
COPY grafana.ini /etc/grafana/grafana.ini
COPY provisioning/ /etc/grafana/provisioning/

# Create dashboards directory
RUN mkdir -p /var/lib/grafana/dashboards

# Copy dashboards
COPY provisioning/dashboards/dashboards/ /var/lib/grafana/dashboards/

# Set permissions
RUN chown -R grafana:grafana /var/lib/grafana/dashboards

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

USER grafana