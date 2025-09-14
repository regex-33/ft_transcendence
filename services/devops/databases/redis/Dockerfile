FROM redis:7.2-alpine

RUN apk add --no-cache bash
RUN mkdir -p /var/log/redis && \
    chown redis:redis /var/log/redis

# Create data directory
RUN mkdir -p /data && \
    chown redis:redis /data

USER redis

EXPOSE 6379

# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#     CMD redis-cli -a "regex-33" ping || exit 1

CMD ["redis-server", \
     "--logfile", "/var/log/redis/redis-server.log", \
     "--loglevel", "notice", \
     "--save", "900", "1", \
     "--save", "300", "10", \
     "--save", "60", "10000", \
     "--requirepass", "regex-33", \
     "--bind", "0.0.0.0", \
     "--maxmemory", "512mb", \
     "--maxmemory-policy", "allkeys-lru", \
     "--appendonly", "yes", \
     "--appendfsync", "everysec", \
     "--slowlog-log-slower-than", "10000", \
     "--slowlog-max-len", "128", \
     "--timeout", "0", \
     "--tcp-keepalive", "300"]
