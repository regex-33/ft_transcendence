FROM debian:bullseye

# Install shell + tools
RUN apt-get update && apt-get install -y bash curl vim procps net-tools iputils-ping && rm -rf /var/lib/apt/lists/*

# Copy exporter binary from official image
COPY --from=oliver006/redis_exporter:v1.74.0 /redis_exporter /bin/redis_exporter

EXPOSE 9121

ENTRYPOINT ["/bin/redis_exporter"]
