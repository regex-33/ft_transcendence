FROM postgres:17-alpine

RUN apk add --no-cache \
    curl \
    bash \
    tzdata

RUN mkdir -p /var/log/postgresql && \
    chown postgres:postgres /var/log/postgresql

RUN mkdir -p /docker-entrypoint-initdb.d

# COPY scripts/init-logging.sh /docker-entrypoint-initdb.d/init-logging.sh

# RUN chmod +x /docker-entrypoint-initdb.d/init-logging.sh

# HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
#     CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1

# Expose port
EXPOSE 5432

# ENV POSTGRES_INITDB_ARGS="--auth-host=scram-sha-256"
# ENV PGDATA=/var/lib/postgresql/data

CMD ["postgres", \
     "-c", "log_destination=stderr,csvlog", \
     "-c", "logging_collector=on", \
     "-c", "log_filename=postgresql-%Y-%m-%d_%H%M%S.log", \
     "-c", "log_rotation_age=1d", \
     "-c", "log_rotation_size=100MB", \
     "-c", "log_min_duration_statement=1000", \
     "-c", "log_line_prefix=%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ", \
     "-c", "log_statement=all", \
     "-c", "log_connections=on", \
     "-c", "log_disconnections=on", \
     "-c", "shared_buffers=128MB", \
     "-c", "effective_cache_size=512MB", \
     "-c", "maintenance_work_mem=64MB", \
     "-c", "checkpoint_completion_target=0.9", \
     "-c", "wal_buffers=16MB"]

# # Start PostgreSQL with logging configuration
# CMD ["postgres", \
#      "-c", "log_destination=stderr,csvlog", \
#      "-c", "logging_collector=on", \
#      "-c", "log_directory=/var/log/postgresql", \
#      "-c", "log_filename=postgresql-%Y-%m-%d_%H%M%S.log", \
#      "-c", "log_rotation_age=1d", \
#      "-c", "log_rotation_size=100MB", \
#      "-c", "log_min_duration_statement=1000", \
#      "-c", "log_line_prefix=%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ", \
#      "-c", "log_statement=all", \
#      "-c", "log_connections=on", \
#      "-c", "log_disconnections=on", \
#      "-c", "shared_buffers=128MB", \
#      "-c", "effective_cache_size=512MB", \
#      "-c", "maintenance_work_mem=64MB", \
#      "-c", "checkpoint_completion_target=0.9", \
#      "-c", "wal_buffers=16MB"]