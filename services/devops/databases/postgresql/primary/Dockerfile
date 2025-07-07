FROM postgres:15

# Install extensions
RUN apt-get update && apt-get install -y \
    postgresql-contrib \
    && rm -rf /var/lib/apt/lists/*

# Copy configuration files
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

# Copy initialization scripts
COPY init/ /docker-entrypoint-initdb.d/

# Set configuration file location
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]