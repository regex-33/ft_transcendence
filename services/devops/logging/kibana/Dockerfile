FROM docker.elastic.co/kibana/kibana:8.8.0

# Copy configuration
COPY kibana.yml /usr/share/kibana/config/kibana.yml

# Copy dashboards
COPY dashboards/ /usr/share/kibana/dashboards/

# Install plugins (if any)
# RUN bin/kibana-plugin install plugin-name

# Create custom entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 5601

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5601/api/status || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]