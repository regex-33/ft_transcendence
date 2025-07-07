FROM docker.elastic.co/elasticsearch/elasticsearch:8.8.0

# Copy configuration
COPY elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml

# Copy index templates
COPY index-templates/ /usr/share/elasticsearch/index-templates/

# Install plugins
RUN bin/elasticsearch-plugin install analysis-icu
RUN bin/elasticsearch-plugin install analysis-phonetic

# Create custom entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose ports
EXPOSE 9200 9300

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9200/_cluster/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]