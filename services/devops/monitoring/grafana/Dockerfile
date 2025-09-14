# FROM grafana/grafana:10.2.0
FROM grafana/grafana:12.1.1


# ENV GF_INSTALL_PLUGINS="grafana-clock-panel,grafana-piechart-panel,grafana-worldmap-panel,vonage-status-panel"

USER root
RUN apk add --no-cache  curl jq bash

# Copy datasources and dashboards
COPY provisioning/datasources/ /etc/grafana/provisioning/datasources/
COPY provisioning/dashboards/ /var/lib/grafana/dashboards/

# Create dashboard provisioning config
RUN mkdir -p /etc/grafana/provisioning/dashboards/

# Copy dashboard provisioning configuration
COPY dashboards/dashboards.yml /etc/grafana/provisioning/dashboards/dashboards.yml

# # Fix permissions so grafana (uid 472) can read/write
# RUN chown -R 472:472 /etc/grafana /var/lib/grafana

COPY scripts/setup-dashboards.sh /usr/local/bin/setup-dashboards.sh
RUN chmod +x /usr/local/bin/setup-dashboards.sh
USER 472

# # Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# # Switch back to Grafana's default runtime user
# USER 472

EXPOSE 3000

CMD [ "/usr/local/bin/setup-dashboards.sh" ]