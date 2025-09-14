FROM debian:bullseye

# Install shell + debugging tools
RUN apt-get update && apt-get install -y \
    bash curl vim procps iputils-ping net-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy postgres_exporter binary from the official image
COPY --from=prometheuscommunity/postgres-exporter:v0.17.1 /bin/postgres_exporter /bin/postgres_exporter

EXPOSE 9187

ENTRYPOINT ["/bin/postgres_exporter"]
