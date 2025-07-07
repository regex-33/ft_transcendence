FROM prom/prometheus:latest

# Copy configuration
COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY alerts/ /etc/prometheus/alerts/
COPY rules/ /etc/prometheus/rules/

# Create data directory
RUN mkdir -p /prometheus
RUN chown -R prometheus:prometheus /prometheus

# Expose port
EXPOSE 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9090/-/healthy || exit 1

CMD ["--config.file=/etc/prometheus/prometheus.yml", \
     "--storage.tsdb.path=/prometheus", \
     "--web.console.libraries=/etc/prometheus/console_libraries", \
     "--web.console.templates=/etc/prometheus/consoles", \
     "--storage.tsdb.retention.time=15d", \
     "--web.enable-lifecycle"]