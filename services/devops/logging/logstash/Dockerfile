FROM docker.elastic.co/logstash/logstash:8.8.0

# Copy configuration
COPY logstash.yml /usr/share/logstash/config/logstash.yml
COPY pipeline/ /usr/share/logstash/pipeline/
COPY patterns/ /usr/share/logstash/patterns/

# Install plugins
RUN bin/logstash-plugin install logstash-filter-json_encode
RUN bin/logstash-plugin install logstash-output-email

# Create logs directory
RUN mkdir -p /usr/share/logstash/logs

# Set permissions
RUN chown -R logstash:logstash /usr/share/logstash/logs

# Expose ports
EXPOSE 5044 9600

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9600 || exit 1

CMD ["/usr/local/bin/docker-entrypoint"]