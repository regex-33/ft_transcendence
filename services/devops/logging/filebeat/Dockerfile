FROM docker.elastic.co/beats/filebeat:8.15.0

# Copy config and modules
USER root
RUN mkdir -p /usr/share/filebeat/modules.d/

# Install additional packages
RUN apt update -y && \
    apt install -y curl && \
    apt clean all

# Create directories
RUN mkdir -p /var/log/filebeat && \
    chown -R filebeat:filebeat /var/log/filebeat

# Copy configuration files
COPY config/filebeat.yml /usr/share/filebeat/filebeat.yml
COPY config/filebeat.manager.yml /usr/share/filebeat/filebeat.manager.yml
COPY config/filebeat.worker.yml /usr/share/filebeat/filebeat.worker.yml


COPY modules.d/system.yml /usr/share/filebeat/modules.d/system.yml
COPY modules.d/nginx.yml /usr/share/filebeat/modules.d/nginx.yml
COPY modules.d/postgresql.yml /usr/share/filebeat/modules.d/postgresql.yml
COPY modules.d/redis.yml /usr/share/filebeat/modules.d/redis.yml

# Set permissions
RUN chown -R filebeat:filebeat /usr/share/filebeat/ && \
    chmod 644 /usr/share/filebeat/filebeat*.yml

# Fix ownership and permissions
RUN chown -R root:root /usr/share/filebeat/ && \
    chmod -R go-w /usr/share/filebeat/ && \
    chmod 600 /usr/share/filebeat/filebeat.yml && \
    chmod 644 /usr/share/filebeat/modules.d/*.yml

# Check available modules and enable only existing ones
RUN filebeat modules list > /tmp/available_modules.txt 2>&1 || true

# Enable modules that exist (using || true to not fail if module doesn't exist)
RUN filebeat modules enable system 
RUN filebeat modules enable nginx
RUN filebeat modules enable postgresql 
RUN filebeat modules enable redis 

# Show what modules are enabled
RUN filebeat modules list 

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5066/stats || exit 1


ENTRYPOINT ["/usr/share/filebeat/filebeat"]
CMD ["-e", "-c", "/usr/share/filebeat/filebeat.yml"]