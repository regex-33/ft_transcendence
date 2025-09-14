FROM debian:bullseye

# Install debugging tools
RUN apt-get update && apt-get install -y \
    bash curl vim procps net-tools iputils-ping wget \
    && rm -rf /var/lib/apt/lists/*

# Copy exporter binary from official image
COPY --from=quay.io/prometheuscommunity/elasticsearch-exporter:v1.7.0 \
     /bin/elasticsearch_exporter /bin/elasticsearch_exporter

EXPOSE 9114

ENTRYPOINT ["/bin/elasticsearch_exporter"]
