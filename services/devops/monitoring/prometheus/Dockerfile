# Stage 1: Get prometheus binary from official image
FROM prom/prometheus:v2.47.0 AS prometheus

# Stage 2: Real base with package manager
FROM debian:bullseye

USER root

# Install useful tools
RUN apt-get update && apt-get install -y \
    wget curl vim net-tools iputils-ping procps \
    && rm -rf /var/lib/apt/lists/*

# Create prometheus user/group
RUN groupadd -r prometheus && useradd -r -g prometheus prometheus

# Create necessary directories
RUN mkdir -p /etc/prometheus/rules /var/lib/prometheus /prometheus && \
    chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus /prometheus

# Copy binaries and default data from official image
COPY --from=prometheus /bin/prometheus /bin/
COPY --from=prometheus /bin/promtool /bin/
COPY --from=prometheus /usr/share/prometheus /usr/share/prometheus
COPY --from=prometheus /etc/prometheus /etc/prometheus

# Copy your custom configs
COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY alerts.yml /etc/prometheus/rules/alerts.yml

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:9090/-/healthy || exit 1

EXPOSE 9090

USER prometheus

ENTRYPOINT ["/bin/prometheus"]
CMD ["--config.file=/etc/prometheus/prometheus.yml", \
     "--storage.tsdb.path=/prometheus", \
     "--storage.tsdb.retention.time=30d", \
     "--web.console.libraries=/usr/share/prometheus/console_libraries", \
     "--web.console.templates=/usr/share/prometheus/consoles", \
     "--web.enable-lifecycle", \
     "--web.enable-admin-api"]
