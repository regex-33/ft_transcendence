#!/bin/bash

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "Creating backup at $TIMESTAMP..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL databases
docker-compose exec -T postgres pg_dumpall -c -U admin > "$BACKUP_DIR/postgres_$TIMESTAMP.sql"

# Backup Redis data
docker-compose exec -T redis redis-cli --rdb - > "$BACKUP_DIR/redis_$TIMESTAMP.rdb"

# Backup uploaded files
docker run --rm -v transcendence_file_uploads:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/uploads_$TIMESTAMP.tar.gz -C /data .

# Backup configuration files
tar czf "$BACKUP_DIR/configs_$TIMESTAMP.tar.gz" \
    .env \
    docker-compose.yml \
    docker-compose.prod.yml \
    docker-compose.dev.yml \
    services/devops/nginx/conf.d/ \
    services/devops/monitoring/prometheus/prometheus.yml \
    services/devops/logging/logstash/pipeline/

echo "Backup completed: $BACKUP_DIR"
echo "Files created:"
ls -la "$BACKUP_DIR/*$TIMESTAMP*"