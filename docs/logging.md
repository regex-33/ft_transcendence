# Logging Stack Documentation for FT Transcendence

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Docker Compose Configuration](#docker-compose-configuration)
4. [Elasticsearch Configuration](#elasticsearch-configuration)
5. [Kibana Configuration](#kibana-configuration)
6. [Logstash Configuration](#logstash-configuration)
7. [Filebeat Configuration](#filebeat-configuration)
8. [Vault Integration](#vault-integration)
9. [Network Architecture](#network-architecture)
10. [Security Implementation](#security-implementation)
11. [Monitoring and Health Checks](#monitoring-and-health-checks)
12. [Data Flow](#data-flow)
13. [Index Management](#index-management)
14. [Troubleshooting](#troubleshooting)

## Overview

The FT Transcendence logging stack implements a comprehensive ELK (Elasticsearch, Logstash, Kibana) solution with Filebeat for centralized log collection, processing, and visualization. The stack is designed for high availability, security, and scalability in a Docker Swarm environment.

### Key Components:
- **Elasticsearch**: Distributed search and analytics engine for log storage
- **Kibana**: Web interface for log visualization and analysis
- **Logstash**: Data processing pipeline for log parsing and enrichment
- **Filebeat**: Lightweight log shipper for log collection
- **Vault Integration**: Centralized secrets management with AppRole authentication
- **SSL/TLS**: End-to-end encryption for all communications

### Features:
- Service-specific log collection from FT Transcendence microservices
- JSON log parsing and field extraction
- Real-time log processing and indexing
- Security event monitoring and alerting
- Performance metrics and monitoring integration
- Automated index lifecycle management

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Docker        │    │   System        │
│   Logs          │───▶│   Container     │───▶│   Files         │
│                 │    │   Logs          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Filebeat      │───▶│   Logstash      │───▶│  Elasticsearch  │
│   (Log Shipper) │    │   (Processing)  │    │   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Kibana        │◀───│   Vault Agent   │    │   Monitoring    │
│  (Visualization)│    │   (Secrets)     │    │   (Metrics)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites & System Requirements

### Hardware Requirements

**Minimum Requirements per Node:**
- **CPU**: 2 cores minimum, 4 cores recommended
- **RAM**: 4GB minimum, 8GB recommended for logging nodes
- **Storage**: 50GB minimum, 500GB+ recommended for log retention
- **Network**: Gigabit Ethernet for optimal log transfer rates

**Production Recommendations:**
- **CPU**: 8+ cores for heavy log processing workloads
- **RAM**: 16GB+ for Elasticsearch and Logstash performance
- **Storage**: NVMe SSD for optimal I/O performance
- **Network**: 10Gbps for high-volume logging environments

### Network Configuration

**Required Ports for Docker Swarm:**

| Port | Protocol | Purpose | Direction | Service |
|------|----------|---------|-----------|---------|
| 2376 | TCP | Docker daemon (TLS) | Incoming | Docker API |
| 2377 | TCP | Swarm management | Incoming | Cluster Control |
| 7946 | TCP/UDP | Node communication | Bidirectional | Cluster Discovery |
| 4789 | UDP | Overlay network (VXLAN) | Bidirectional | Container Networking |
| 22 | TCP | SSH | Incoming | Remote Access |

**Application-Specific Ports:**

| Port | Protocol | Service | Purpose | External Access |
|------|----------|---------|---------|-----------------|
| 9200 | TCP | Elasticsearch | HTTP API | Internal Only |
| 9300 | TCP | Elasticsearch | Transport | Internal Only |
| 5601 | TCP | Kibana | Web Interface | Via Traefik |
| 5044 | TCP | Logstash | Beats Input | Internal Only |
| 5045-5048 | TCP | Logstash | Additional Inputs | Internal Only |
| 5003 | TCP | Logstash | HTTP Input | Internal Only |
| 8081 | TCP | Logstash | Monitoring | Internal Only |
| 9600 | TCP | Logstash | Node Info API | Internal Only |
| 5066 | TCP | Filebeat | HTTP Monitoring | Internal Only |
| 9114 | TCP | Elasticsearch Exporter | Prometheus Metrics | Internal Only |

### Docker Daemon Configuration

**Required Configuration File: `/etc/docker/daemon.json`**

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "metrics-addr": "127.0.0.1:9323",
  "experimental": false,
  "userland-proxy": false,
  "live-restore": true,
  "default-ulimits": {
    "memlock": {
      "Hard": -1,
      "Name": "memlock",
      "Soft": -1
    },
    "nofile": {
      "Hard": 65536,
      "Name": "nofile",
      "Soft": 65536
    }
  }
}
```

**Configuration Breakdown:**

| Setting | Purpose | Why Important for Logging |
|---------|---------|---------------------------|
| `log-driver: json-file` | Default logging driver for containers | Enables structured log collection by Filebeat |
| `max-size: 10m` | Maximum size of each log file | Prevents logs from filling up disk space |
| `max-file: 3` | Number of log files to keep | Balances log retention with disk usage |
| `storage-driver: overlay2` | How Docker stores images and containers | Most efficient for logging container I/O |
| `metrics-addr: 127.0.0.1:9323` | Prometheus metrics endpoint | Enables monitoring of Docker daemon |
| `experimental: false` | Disable experimental features | Ensures stability in production logging |
| `userland-proxy: false` | Disable userland proxy | Better performance for overlay networks |
| `live-restore: true` | Keep containers running during daemon restart | Maintains log collection during updates |
| `memlock: -1` | Unlimited memory locking | Required for Elasticsearch bootstrap.memory_lock |
| `nofile: 65536` | File descriptor limits | Supports high file handle usage in logging stack |

### Firewall Configuration

```bash
# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow Docker Swarm ports
sudo ufw allow 2376/tcp    # Docker daemon (TLS)
sudo ufw allow 2377/tcp    # Swarm management
sudo ufw allow 7946/tcp    # Node communication
sudo ufw allow 7946/udp    # Node discovery
sudo ufw allow 4789/udp    # Overlay network (VXLAN)

# Allow application-specific ports (if external access needed)
sudo ufw allow 5601/tcp    # Kibana (via Traefik)
sudo ufw allow 9200/tcp    # Elasticsearch (if direct access needed)

# Enable firewall
sudo ufw enable
```

### System Optimization

```bash
# Enable IP forwarding (required for overlay networks)
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf

# Optimize for Elasticsearch
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
echo 'vm.swappiness=1' | sudo tee -a /etc/sysctl.conf
echo 'fs.file-max=65536' | sudo tee -a /etc/sysctl.conf

# Apply changes
sudo sysctl -p

# Set ulimits for elasticsearch user
echo 'elasticsearch soft memlock unlimited' | sudo tee -a /etc/security/limits.conf
echo 'elasticsearch hard memlock unlimited' | sudo tee -a /etc/security/limits.conf
echo 'elasticsearch soft nofile 65536' | sudo tee -a /etc/security/limits.conf
echo 'elasticsearch hard nofile 65536' | sudo tee -a /etc/security/limits.conf
```

## Docker Compose Configuration

### Network Definitions

```yaml
networks:
  logging-network:
    external: true
    driver: overlay
    encrypted: true
    attachable: true
  traefik-public:
    external: true
    driver: overlay
    encrypted: true
  monitoring-network:
    external: true
    driver: overlay
    encrypted: true
  vault-network:
    external: true
    driver: overlay
    encrypted: true
```

**Network Configuration Breakdown:**

| Network | Purpose | Encryption | Attachable | Services |
|---------|---------|------------|------------|----------|
| `logging-network` | Internal logging communication | Yes | Yes | Elasticsearch, Logstash, Kibana, Filebeat |
| `traefik-public` | External web access routing | Yes | No | Kibana (external access) |
| `monitoring-network` | Metrics collection integration | Yes | Yes | All exporters, monitoring services |
| `vault-network` | Secure secrets management | Yes | No | Vault Agent, secret consumers |

### Vault Agent Service
The Vault Agent provides centralized secrets management for the entire logging stack:

```yaml
vault-agent-logging:
  image: ft_transcendence/vault-agent
  environment:
    - VAULT_ADDR=https://vault.ft-transcendence.com:8200
    - VAULT_SKIP_VERIFY=true
    - VAULT_NAMESPACE=logging
    - VAULT_LOG_LEVEL=info
  volumes:
    - vault-logging-agent-data:/vault/data
    - vault-logging-secrets:/vault/secrets
  configs:
    - source: vault-agent-logging-config
      target: /vault/config/vault-agent.hcl
      mode: 0644
  secrets:
    - source: logging-role-id
      target: /vault/secrets/role-id
      mode: 0400
    - source: logging-secret-id  
      target: /vault/secrets/secret-id
      mode: 0400
  networks:
    - vault-network
  deploy:
    replicas: 1
    placement:
      constraints: 
        - node.labels.type == logging
    restart_policy:
      condition: on-failure
      delay: 10s
      max_attempts: 5
    resources:
      limits:
        memory: 128M
      reservations:
        memory: 64M
  healthcheck:
    test: ["CMD-SHELL", "vault status -address=https://vault.ft-transcendence.com:8200 || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
```

**Configuration Breakdown:**
- `image: ft_transcendence/vault-agent`: Custom Vault Agent image with logging-specific configuration
- `VAULT_ADDR`: Points to the central Vault server for authentication and secret retrieval
- `VAULT_SKIP_VERIFY`: Allows self-signed certificates in development environments
- `VAULT_NAMESPACE`: Logical separation for logging secrets in Vault
- `VAULT_LOG_LEVEL`: Controls verbosity of Vault Agent logging
- `vault-logging-secrets:/vault/secrets`: Shared volume where decrypted secrets are stored for other services
- `placement.constraints`: Ensures deployment on logging-designated nodes
- `resources.limits`: Memory constraints prevent resource exhaustion
- `healthcheck`: Verifies Vault connectivity and agent health

**Secrets Management:**
- Uses AppRole authentication with `logging-role-id` and `logging-secret-id`
- Automatically renews tokens and keeps secrets updated
- Provides Elasticsearch credentials, TLS certificates, and service tokens
- Template-based secret injection ensures consistent formatting

### Elasticsearch Service

```yaml
elasticsearch:
  image: ft_transcendence/elasticsearch
  environment:
    - ELASTIC_CLUSTER_NAME=ft-transcendence-logs
    - ELASTIC_NODE_NAME=elasticsearch-01
    - ELASTICSEARCH_PORT=9200
    - ELASTIC_DISCOVERY_SEEDS=elasticsearch
    - ELASTIC_INIT_MASTER_NODE=elasticsearch-01
    - ES_JAVA_OPTS=-Xms1g -Xmx1g
    - ELASTIC_PASSWORD_FILE=/run/secrets/elastic_password
    - KIBANA_PASSWORD_FILE=/run/secrets/kibana_password
  ports:
    - "9200:9200"    # HTTP API
    - "9300:9300"    # Transport
  volumes:
    - elasticsearch-data:/usr/share/elasticsearch/data
    - elasticsearch-logs:/usr/share/elasticsearch/logs
    - vault-logging-secrets:/vault/secrets:ro
  secrets:
    - source: elastic.ca
      target: /certs/ca.crt
      mode: 0444
    - source: elasticsearch.certificate
      target: /certs/elasticsearch.crt
      mode: 0444
    - source: elasticsearch.key
      target: /certs/elasticsearch.key
      mode: 0400
    - source: elasticsearch.keystore
      target: /usr/share/elasticsearch/config/elasticsearch.keystore
      mode: 0660
  networks:
    - logging-network
    - monitoring-network
  deploy:
    replicas: 1
    placement:
      constraints: 
        - node.labels.type == logging
    restart_policy:
      condition: on-failure
      delay: 10s
      max_attempts: 5
    resources:
      limits:
        memory: 2G
        cpus: '2.0'
      reservations:
        memory: 1G
        cpus: '1.0'
    update_config:
      parallelism: 1
      delay: 30s
      failure_action: rollback
    rollback_config:
      parallelism: 1
      delay: 30s
  ulimits:
    memlock:
      soft: -1
      hard: -1
    nofile:
      soft: 65536
      hard: 65536
  sysctls:
    - vm.max_map_count=262144
  healthcheck:
    test: ["CMD-SHELL", "set -a && source /vault/secrets/elasticsearch.env && set +a && curl -sf --insecure https://$$ELASTIC_USERNAME:$$ELASTIC_PASSWORD@localhost:$$ELASTICSEARCH_PORT/_cat/health | grep -ioE 'green|yellow' || echo 'not green/yellow cluster status'"]
    interval: 30s
    timeout: 15s
    retries: 5
    start_period: 120s
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

**Configuration Breakdown:**

| Parameter | Value | Purpose | Production Notes |
|-----------|-------|---------|------------------|
| `ELASTIC_CLUSTER_NAME` | `ft-transcendence-logs` | Unique cluster identifier for log storage separation | Should be consistent across all nodes |
| `ELASTIC_NODE_NAME` | `elasticsearch-01` | Individual node identifier for cluster management | Use unique names per node in multi-node setup |
| `ELASTICSEARCH_PORT` | `9200` | HTTP API port for client connections | Standard Elasticsearch HTTP port |
| `ELASTIC_DISCOVERY_SEEDS` | `elasticsearch` | Node discovery configuration for cluster formation | Use actual hostnames/IPs in production |
| `ELASTIC_INIT_MASTER_NODE` | `elasticsearch-01` | Initial master node for cluster bootstrap | Critical for cluster initialization |
| `ES_JAVA_OPTS` | `-Xms1g -Xmx1g` | JVM memory allocation (1GB heap for optimal performance) | Adjust based on available memory |

**Port Configuration:**

| Port | Protocol | Purpose | Security | Monitoring |
|------|----------|---------|----------|------------|
| `9200` | TCP | HTTP API for REST operations | HTTPS with client certificates | Health checks, metrics |
| `9300` | TCP | Transport layer for cluster communication | TLS with node certificates | Cluster status |

**Resource Allocation:**
```yaml
resources:
  limits:
    memory: 2G        # Maximum memory usage
    cpus: '2.0'       # Maximum CPU cores
  reservations:
    memory: 1G        # Guaranteed memory
    cpus: '1.0'       # Guaranteed CPU cores
```

- Memory limit prevents OOM issues in constrained environments
- CPU limits ensure fair resource sharing
- Reservation ensures minimum memory availability for stable operation
- Heap size should be 50% of container memory limit

**Volume Configuration:**
```yaml
volumes:
  - elasticsearch-data:/usr/share/elasticsearch/data
  - elasticsearch-logs:/usr/share/elasticsearch/logs
  - vault-logging-secrets:/vault/secrets:ro
```

- `elasticsearch-data`: Persistent storage for indices and cluster state
- `elasticsearch-logs`: Log files for debugging and monitoring
- `vault-logging-secrets`: Read-only access to credentials and certificates

**Security Configuration:**
```yaml
secrets:
  - source: elastic.ca
    target: /certs/ca.crt
    mode: 0444        # Read-only for all
  - source: elasticsearch.certificate
    target: /certs/elasticsearch.crt
    mode: 0444        # Read-only for all
  - source: elasticsearch.key
    target: /certs/elasticsearch.key
    mode: 0400        # Read-only for owner only
```

- CA certificate for trust chain validation
- Node certificate for TLS authentication
- Private key with restricted permissions
- Keystore for encrypted password storage

**System Limits:**
```yaml
ulimits:
  memlock:
    soft: -1          # Unlimited memory locking
    hard: -1
  nofile:
    soft: 65536       # File descriptor limits
    hard: 65536
sysctls:
  - vm.max_map_count=262144  # Virtual memory areas
```

- Memory locking prevents swapping for consistent performance
- File descriptor limits support high concurrent connections
- Virtual memory settings required for large-scale indexing

**Health Check:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "set -a && source /vault/secrets/elasticsearch.env && set +a && curl -sf --insecure https://$$ELASTIC_USERNAME:$$ELASTIC_PASSWORD@localhost:$$ELASTICSEARCH_PORT/_cat/health | grep -ioE 'green|yellow' || echo 'not green/yellow cluster status'"]
  interval: 30s
  timeout: 15s
  retries: 5
  start_period: 120s
```

- Sources credentials from Vault-managed environment file
- Checks cluster health status (green/yellow indicates healthy cluster)
- Uses authenticated HTTPS request with SSL verification disabled for self-signed certificates
- Extended start period accounts for Elasticsearch initialization time
- Multiple retries handle temporary network issues

### Kibana Service

```yaml
kibana:
  image: ft_transcendence/kibana
  environment:
    - KIBANA_PORT=5601
    - SERVER_REWRITEBASEPATH=false
    - KIBANA_INIT_TIMEOUT=300000
    - SERVER_PUBLICBASEURL=https://logging.ft-transcendence.com
    - SERVER_HOST=0.0.0.0
    - ELASTICSEARCH_HOSTS=https://elasticsearch:9200
    - ELASTICSEARCH_USERNAME_FILE=/run/secrets/kibana_user
    - ELASTICSEARCH_PASSWORD_FILE=/run/secrets/kibana_password
  ports:
    - "5601:5601"    # Web interface
  volumes:
    - kibana-data:/usr/share/kibana/data
    - vault-logging-secrets:/vault/secrets:ro
  secrets:
    - source: elastic.ca
      target: /certs/ca.crt
      mode: 0444
    - source: kibana.certificate
      target: /certs/kibana.crt
      mode: 0444
    - source: kibana.key
      target: /certs/kibana.key
      mode: 0400
  networks:
    - traefik-public
    - logging-network
  deploy:
    replicas: 1
    placement:
      constraints: 
        - node.labels.type == logging
    restart_policy:
      condition: on-failure
      delay: 10s
      max_attempts: 3
    resources:
      limits:
        memory: 1G
        cpus: '1.0'
      reservations:
        memory: 512M
        cpus: '0.5'
    update_config:
      parallelism: 1
      delay: 30s
      failure_action: rollback
    labels:
      # Traefik HTTPS router
      - "traefik.enable=true"
      - "traefik.http.routers.kibana.rule=Host(`logging.ft-transcendence.com`)"
      - "traefik.http.routers.kibana.entrypoints=websecure"
      - "traefik.http.routers.kibana.tls=true"
      - "traefik.http.routers.kibana.tls.certresolver=letsencrypt"
      - "traefik.http.services.kibana.loadbalancer.server.port=5601"
      
      # Security headers middleware
      - "traefik.http.routers.kibana.middlewares=security-headers,auth-basic"
      - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
      - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
      - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
      - "traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin"
      - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
      - "traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true"
      - "traefik.http.middlewares.security-headers.headers.stsPreload=true"
      
      # HTTP to HTTPS redirect
      - "traefik.http.routers.kibana-http.rule=Host(`logging.ft-transcendence.com`)"
      - "traefik.http.routers.kibana-http.entrypoints=web"
      - "traefik.http.routers.kibana-http.middlewares=redirect-to-https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
      
      # Network specification
      - "traefik.docker.network=traefik-public"
  env_file:
    - ./../services/devops/logging/secrets/.env.kibana.token
  entrypoint: |
    bash -c "
      echo 'Waiting for vault secrets...';
      while [ ! -f /vault/secrets/kibana.env ] || [ ! -f /vault/secrets/elasticsearch.env ]; do 
        echo 'Waiting for vault secrets to be available...'; 
        sleep 5; 
      done;
      echo 'Vault secrets found, sourcing environment variables...';
      set -a && source /vault/secrets/kibana.env && source /vault/secrets/elasticsearch.env && set +a;
      echo 'Environment variables loaded, starting Kibana...';
      exec /usr/local/bin/kibana-docker
    "
  healthcheck:
    test: ["CMD-SHELL", "curl -f https://localhost:5601/api/status -k || exit 1"]
    interval: 30s
    timeout: 15s
    retries: 5
    start_period: 180s
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

**Configuration Breakdown:**

| Parameter | Value | Purpose | Production Notes |
|-----------|-------|---------|------------------|
| `KIBANA_PORT` | `5601` | Web interface port for dashboard access | Standard Kibana port |
| `SERVER_REWRITEBASEPATH` | `false` | Disables base path rewriting for direct access | Enable for subpath deployments |
| `KIBANA_INIT_TIMEOUT` | `300000` | Extended initialization timeout for large datasets | Increase for very large clusters |
| `SERVER_PUBLICBASEURL` | `https://logging.ft-transcendence.com` | Public URL for external access through Traefik | Must match Traefik host rule |
| `SERVER_HOST` | `0.0.0.0` | Binds to all interfaces for container networking | Required for Docker networking |

**Port Configuration:**

| Port | Protocol | Purpose | Security | Access Method |
|------|----------|---------|----------|---------------|
| `5601` | TCP | Web interface for log visualization | HTTPS only | Via Traefik reverse proxy |

**Traefik Integration:**
```yaml
labels:
  # HTTPS router configuration
  - "traefik.enable=true"
  - "traefik.http.routers.kibana.rule=Host(`logging.ft-transcendence.com`)"
  - "traefik.http.routers.kibana.entrypoints=websecure"
  - "traefik.http.routers.kibana.tls=true"
  - "traefik.http.routers.kibana.tls.certresolver=letsencrypt"
  - "traefik.http.services.kibana.loadbalancer.server.port=5601"
```

- Enables Traefik reverse proxy for external access
- HTTPS-only access with automatic Let's Encrypt certificate management
- Load balancer configuration for high availability
- Host-based routing for multi-service environments

**Security Headers:**
```yaml
# Security headers middleware
- "traefik.http.middlewares.security-headers.headers.frameDeny=true"
- "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
- "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
- "traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin"
- "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
```

- Frame denial prevents clickjacking attacks
- Content type sniffing protection prevents MIME confusion attacks
- XSS filter activation for additional security
- Strict Transport Security enforces HTTPS for one year
- Referrer policy limits information leakage

**Startup Process:**
```yaml
entrypoint: |
  bash -c "
    echo 'Waiting for vault secrets...';
    while [ ! -f /vault/secrets/kibana.env ] || [ ! -f /vault/secrets/elasticsearch.env ]; do 
      echo 'Waiting for vault secrets to be available...'; 
      sleep 5; 
    done;
    echo 'Vault secrets found, sourcing environment variables...';
    set -a && source /vault/secrets/kibana.env && source /vault/secrets/elasticsearch.env && set +a;
    echo 'Environment variables loaded, starting Kibana...';
    exec /usr/local/bin/kibana-docker
  "
```

- Waits for Vault Agent to populate secrets before starting
- Sources both Kibana and Elasticsearch credentials
- Ensures proper initialization order in the stack
- Provides detailed logging for troubleshooting startup issues

### Logstash Service

```yaml
logstash:
  image: ft_transcendence/logstash
  environment:
    - ENVIRONMENT=development
    - LOG_LEVEL=info
    - LS_JAVA_OPTS=-Xms1g -Xmx1g
    - PIPELINE_WORKERS=4
    - PIPELINE_BATCH_SIZE=125
    - PIPELINE_BATCH_DELAY=50
  ports:
    - "5044:5044"    # Beats input (Filebeat)
    - "5045:5045"    # Additional Beats input
    - "5046:5046"    # Syslog input
    - "5047:5047"    # JSON HTTP input
    - "5048:5048"    # Custom protocol input
    - "5003:5003"    # HTTP API input
    - "8081:8081"    # Monitoring API
    - "9600:9600"    # Node info and hot threads API
  volumes:
    - logstash-data:/usr/share/logstash/data
    - logstash-logs:/usr/share/logstash/logs
    - vault-logging-secrets:/vault/secrets:ro
  secrets:
    - source: elastic.ca
      target: /certs/ca.crt
      mode: 0444
  networks:
    - logging-network
    - monitoring-network
  deploy:
    replicas: 1
    placement:
      constraints: 
        - node.labels.type == logging
    restart_policy:
      condition: on-failure
      delay: 10s
      max_attempts: 3
    resources:
      limits:
        memory: 2G
        cpus: '2.0'
      reservations:
        memory: 1G
        cpus: '1.0'
    update_config:
      parallelism: 1
      delay: 60s
      failure_action: rollback
      order: stop-first
  depends_on:
    - vault-agent-logging
    - elasticsearch
  command: ["/bin/bash", "-c", "set -a && source /vault/secrets/logstash.env && source /vault/secrets/elasticsearch.env && set +a && /usr/local/bin/docker-entrypoint"]
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:9600/_node/stats || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 120s
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

**Port Configuration:**

| Port | Protocol | Purpose | Input Type | Usage |
|------|----------|---------|------------|-------|
| `5044` | TCP | Primary Beats input port for Filebeat connections | Beats | Main log ingestion |
| `5045` | TCP | Additional Beats input for redundancy | Beats | Secondary/backup ingestion |
| `5046` | TCP | Syslog input for traditional log sources | Syslog | Legacy system integration |
| `5047` | TCP | JSON HTTP input for direct log submission | HTTP | Application direct logging |
| `5048` | TCP | Custom protocol input for specialized sources | Custom | Proprietary log formats |
| `5003` | TCP | HTTP input for REST API log submission | HTTP | API-based log ingestion |
| `8081` | TCP | Monitoring endpoint for health checks | HTTP | Operational monitoring |
| `9600` | TCP | Node info and hot threads API | HTTP | Performance debugging |

**Processing Configuration:**
```yaml
environment:
  - ENVIRONMENT=development
  - LOG_LEVEL=info
  - LS_JAVA_OPTS=-Xms1g -Xmx1g
  - PIPELINE_WORKERS=4
  - PIPELINE_BATCH_SIZE=125
  - PIPELINE_BATCH_DELAY=50
```

- `ENVIRONMENT`: Deployment environment for conditional processing
- `LOG_LEVEL`: Controls Logstash internal logging verbosity
- `LS_JAVA_OPTS`: JVM heap settings (1GB for optimal performance)
- `PIPELINE_WORKERS`: Number of parallel processing threads
- `PIPELINE_BATCH_SIZE`: Events processed per batch for efficiency
- `PIPELINE_BATCH_DELAY`: Milliseconds to wait for batch completion

**Startup Command:**
```yaml
command: ["/bin/bash", "-c", "set -a && source /vault/secrets/logstash.env && source /vault/secrets/elasticsearch.env && set +a && /usr/local/bin/docker-entrypoint"]
```

- Sources Vault-managed credentials before starting
- Loads both Logstash and Elasticsearch configuration
- Uses official Docker entrypoint for proper initialization
- Exports environment variables for pipeline access

### Filebeat Service

```yaml
filebeat-logging:
  image: ft_transcendence/filebeat
  user: root
  hostname: "filebeat-logging-{{.Node.Hostname}}"
  environment:
    - LOGSTASH_HOSTS=logstash:5044
    - NODE_TYPE=logging
    - ELASTICSEARCH_HOSTS=https://elasticsearch:9200
    - ENVIRONMENT=development
    - DATACENTER=regex-33
    - BEAT_STRICT_PERMS=false
  deploy:
    mode: global
    placement:
      constraints: 
        - node.labels.type == logging
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 5
    resources:
      limits:
        memory: 256M
        cpus: '0.5'
      reservations:
        memory: 128M
        cpus: '0.25'
    update_config:
      parallelism: 1
      delay: 30s
      failure_action: continue
  volumes:
    - /var/lib/docker/containers:/var/lib/docker/containers:ro
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - /var/log:/var/log/host:ro
    - /proc:/hostfs/proc:ro
    - /sys/fs/cgroup:/hostfs/sys/fs/cgroup:ro
    - /:/hostfs:ro
    - filebeat-logging-data:/usr/share/filebeat/data
    - vault-logging-secrets:/vault/secrets:ro
  configs:
    - source: filebeat-worker-config
      target: /usr/share/filebeat/filebeat.yml
      mode: 0644
  networks:
    - logging-network
    - monitoring-network
  depends_on:
    - vault-agent-logging
    - logstash
    - elasticsearch
  entrypoint: |
    bash -c "
      echo 'Starting Filebeat initialization...';
      echo 'Setting correct permissions...';
      chown -R root:root /usr/share/filebeat/data || true;
      chmod -R 755 /usr/share/filebeat/data || true;
      
      echo 'Waiting for vault secrets...';
      while [ ! -f /vault/secrets/elasticsearch.env ]; do 
        echo 'Waiting for elasticsearch.env from vault...'; 
        sleep 5; 
      done;
      
      echo 'Vault secrets found, sourcing environment variables...';
      set -a && . /vault/secrets/elasticsearch.env && set +a;
      
      echo 'Testing configuration...';
      /usr/share/filebeat/filebeat test config -c /usr/share/filebeat/filebeat.yml || exit 1;
      
      echo 'Configuration valid, starting filebeat...';
      exec /usr/share/filebeat/filebeat -e -c /usr/share/filebeat/filebeat.yml
    "
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:5066/stats || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
  logging:
    driver: "json-file"
    options:
      max-size: "5m"
      max-file: "2"
```

**Deployment Configuration:**

| Parameter | Value | Purpose | Production Notes |
|-----------|-------|---------|------------------|
| `mode: global` | Global deployment | Deploys one instance per matching node for comprehensive log collection | Ensures complete log coverage |
| `user: root` | Root privileges | Required for accessing Docker socket and log files | Security consideration in production |
| `hostname` | Dynamic hostname | Unique identification per node for log source tracking | Includes node hostname for correlation |
| `placement.constraints` | `node.labels.type == logging` | Restricts deployment to logging nodes only | Use labels to control deployment |

**Volume Mounts:**
```yaml
volumes:
  - /var/lib/docker/containers:/var/lib/docker/containers:ro
  - /var/run/docker.sock:/var/run/docker.sock:ro
  - /var/log:/var/log/host:ro
  - /proc:/hostfs/proc:ro
  - /sys/fs/cgroup:/hostfs/sys/fs/cgroup:ro
  - /:/hostfs:ro
  - filebeat-logging-data:/usr/share/filebeat/data
  - vault-logging-secrets:/vault/secrets:ro
```

- Docker containers directory for container log access
- Docker socket for container metadata enrichment
- Host log directory for system log collection
- Process and cgroup information for system metrics
- Root filesystem for comprehensive monitoring
- Persistent data storage for Filebeat registry
- Vault secrets for Elasticsearch authentication

**Environment Configuration:**
```yaml
environment:
  - LOGSTASH_HOSTS=logstash:5044
  - NODE_TYPE=logging
  - ELASTICSEARCH_HOSTS=https://elasticsearch:9200
  - ENVIRONMENT=development
  - DATACENTER=regex-33
  - BEAT_STRICT_PERMS=false
```

- Logstash connection endpoint for log forwarding
- Node type identification for processing rules
- Direct Elasticsearch connection for monitoring setup
- Environment tagging for log categorization
- Datacenter identification for multi-region deployments
- Permissions relaxation for Docker environment

**Advanced Startup Process:**
```yaml
entrypoint: |
  bash -c "
    echo 'Starting Filebeat initialization...';
    echo 'Setting correct permissions...';
    chown -R root:root /usr/share/filebeat/data || true;
    chmod -R 755 /usr/share/filebeat/data || true;
    
    echo 'Waiting for vault secrets...';
    while [ ! -f /vault/secrets/elasticsearch.env ]; do 
      echo 'Waiting for elasticsearch.env from vault...'; 
      sleep 5; 
    done;
    
    echo 'Vault secrets found, sourcing environment variables...';
    set -a && . /vault/secrets/elasticsearch.env && set +a;
    
    echo 'Testing configuration...';
    /usr/share/filebeat/filebeat test config -c /usr/share/filebeat/filebeat.yml || exit 1;
    
    echo 'Configuration valid, starting filebeat...';
    exec /usr/share/filebeat/filebeat -e -c /usr/share/filebeat/filebeat.yml
  "
```

- Sets proper file permissions for data directory
- Waits for Vault secrets before attempting connection
- Validates configuration before starting
- Provides detailed logging for troubleshooting
- Graceful error handling with exit codes

### Monitoring Services

#### cAdvisor for Container Monitoring
```yaml
cadvisor-logging:
  image: gcr.io/cadvisor/cadvisor:v0.52.1
  hostname: "cadvisor-{{.Node.Hostname}}"
  deploy:
    mode: global
    placement:
      constraints: 
        - node.labels.type == logging
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
    resources:
      limits:
        memory: 256M
        cpus: '0.5'
      reservations:
        memory: 128M
        cpus: '0.25'
  volumes:
    - /:/rootfs:ro
    - /var/run:/var/run:ro
    - /sys:/sys:ro
    - /var/lib/docker/:/var/lib/docker:ro
    - /dev/disk/:/dev/disk:ro
    - /etc/machine-id:/etc/machine-id:ro
  networks:
    - monitoring-network
  ports:
    - "8080:8080"    # cAdvisor web interface
  command:
    - '--housekeeping_interval=30s'
    - '--docker_only=true'
    - '--disable_metrics=cpu_topology,disk,memory_numa,tcp,udp,percpu,sched,process,hugetlb,referenced_memory,resctrl,cpuset,advtcp'
    - '--store_container_labels=false'
    - '--whitelisted_container_labels=com.docker.compose.service,com.docker.swarm.service.name'
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/healthz"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
  logging:
    driver: "json-file"
    options:
      max-size: "5m"
      max-file: "2"
```

**cAdvisor Configuration:**
- Housekeeping interval optimized for Docker environments
- Docker-only mode reduces overhead and focuses on container metrics
- Disabled metrics reduce resource usage and noise
- Label whitelisting for relevant container identification

#### Elasticsearch Exporter
```yaml
elasticsearch-exporter:
  image: ft_transcendence/elasticsearch-exporter
  hostname: "es-exporter-{{.Node.ID}}"
  ports:
    - "9114:9114"    # Prometheus metrics endpoint
  deploy:
    replicas: 1
    placement:
      constraints: 
        - node.labels.type == logging
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
    resources:
      limits:
        memory: 128M
        cpus: '0.5'
      reservations:
        memory: 64M
        cpus: '0.25'
    update_config:
      parallelism: 1
      delay: 30s
  volumes:
    - vault-logging-secrets:/vault/secrets:ro
  environment:
    - ES_TIMEOUT=30s
    - ES_ALL=true
    - ES_INDICES=true
    - ES_SHARDS=true
    - ES_SNAPSHOTS=true
    - ES_CLUSTER_SETTINGS=true
  networks:
    - logging-network
    - monitoring-network
  depends_on:
    - vault-agent-logging
    - elasticsearch
  entrypoint: |
    bash -c "
      echo 'Starting Elasticsearch Exporter...';
      echo 'Waiting for vault secrets...';
      while [ ! -f /vault/secrets/elasticsearch.env ]; do 
        echo 'Waiting for vault secrets to be available...'; 
        sleep 5; 
      done;
      
      echo 'Vault secrets found, sourcing credentials...';
      set -a && . /vault/secrets/elasticsearch.env && set +a;
      
      echo 'Testing Elasticsearch connectivity...';
      curl -k -s --connect-timeout 10 https://$$ELASTIC_USERNAME:$$ELASTIC_PASSWORD@elasticsearch:9200/_cluster/health || echo 'Elasticsearch not ready yet';
      
      echo 'Starting exporter with full metrics collection...';
      exec elasticsearch_exporter \
        --es.uri=https://$$ELASTIC_USERNAME:$$ELASTIC_PASSWORD@elasticsearch:9200 \
        --es.all=$$ES_ALL \
        --es.indices=$$ES_INDICES \
        --es.shards=$$ES_SHARDS \
        --es.snapshots=$$ES_SNAPSHOTS \
        --es.cluster_settings=$$ES_CLUSTER_SETTINGS \
        --es.timeout=$$ES_TIMEOUT \
        --es.ssl-skip-verify \
        --web.listen-address=:9114 \
        --web.telemetry-path=/metrics
    "
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9114/metrics"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
  logging:
    driver: "json-file"
    options:
      max-size: "5m"
      max-file: "2"
```

**Elasticsearch Exporter Configuration:**
- Waits for Vault secrets before connecting to Elasticsearch
- Comprehensive metrics collection (cluster, indices, shards, snapshots)
- SSL verification disabled for self-signed certificates
- 30-second timeout for reliable metric collection
- Tests connectivity before starting metric collection

#### Node Exporter
```yaml
node-exporter-logging:
  image: prom/node-exporter:v1.8.2
  hostname: "node-exporter-{{.Node.Hostname}}"
  deploy:
    mode: global
    placement:
      constraints: 
        - node.labels.type == logging 
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
    resources:
      limits:
        memory: 128M
        cpus: '0.5'
      reservations:
        memory: 64M
        cpus: '0.25'
  volumes:
    - /proc:/host/proc:ro
    - /sys:/host/sys:ro
    - /:/rootfs:ro
    - /etc/hostname:/etc/nodename:ro
    - /etc/localtime:/etc/localtime:ro
  environment:
    - NODE_ID={{.Node.ID}}
    - NODE_HOSTNAME={{.Node.Hostname}}
  networks:
    - monitoring-network
  ports:
    - "9100:9100"    # Node Exporter metrics
  command:
    - '--path.procfs=/host/proc'
    - '--path.rootfs=/rootfs'
    - '--path.sysfs=/host/sys'
    - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    - '--collector.filesystem.ignored-fs-types=^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$$'
    - '--collector.netdev.device-blacklist=^(veth.*|docker.*|br-.*|lo)$$'
    - '--collector.netclass.ignored-devices=^(veth.*|docker.*|br-.*|lo)$$'
    - '--collector.textfile.directory=/var/lib/node_exporter/textfile_collector'
    - '--collector.systemd'
    - '--collector.processes'
    - '--web.listen-address=:9100'
    - '--web.max-requests=40'
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9100/metrics"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
  logging:
    driver: "json-file"
    options:
      max-size: "5m"
      max-file: "2"
```

**Node Exporter Configuration:**
- Global deployment for comprehensive node monitoring
- Filesystem and network device filtering for relevant metrics
- System service and process monitoring enabled
- Rate limiting for metric scraping protection

## Elasticsearch Configuration

### Cluster and Network Settings
```yaml
cluster.name: ${ELASTIC_CLUSTER_NAME}
network.host: 0.0.0.0
transport.host: 0.0.0.0
http.port: ${ELASTICSEARCH_PORT}
```
- `cluster.name`: Environment variable for flexible cluster naming
- `network.host`: Binds to all interfaces for Docker networking
- `transport.host`: Cluster communication endpoint
- `http.port`: Client API port from environment variable

### Discovery Configuration
```yaml
discovery.seed_hosts: ${ELASTIC_DISCOVERY_SEEDS}
cluster.initial_master_nodes: ${ELASTIC_INIT_MASTER_NODE}
```
- Seed hosts for cluster formation and node discovery
- Initial master nodes for cluster bootstrap process

### Node Configuration
```yaml
node.name: ${ELASTIC_NODE_NAME}
node.roles: ["master", "data", "ingest", "ml", "remote_cluster_client"]
```
- Unique node identifier from environment variable
- Multi-role node supporting all Elasticsearch functions
- Master: Cluster management and coordination
- Data: Index storage and search operations
- Ingest: Document preprocessing and enrichment
- ML: Machine learning capabilities for anomaly detection
- Remote cluster client: Cross-cluster search capabilities

### Storage Paths
```yaml
path.data: /usr/share/elasticsearch/data
path.logs: /usr/share/elasticsearch/logs
path.repo: ["/usr/share/elasticsearch/backups"]
```
- Data path for indices and cluster state storage
- Logs path for Elasticsearch operational logs
- Repository path for snapshot and restore operations

### Memory Management
```yaml
bootstrap.memory_lock: true
```
- Prevents memory swapping for consistent performance
- Requires proper ulimit configuration in Docker

### Security Configuration
```yaml
xpack.security.enabled: true

## Transport SSL
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.key: certs/elasticsearch.key
xpack.security.transport.ssl.certificate: certs/elasticsearch.crt
xpack.security.transport.ssl.certificate_authorities: certs/ca.crt

## HTTP SSL
xpack.security.http.ssl.enabled: true
xpack.security.http.ssl.key: certs/elasticsearch.key
xpack.security.http.ssl.certificate: certs/elasticsearch.crt
xpack.security.http.ssl.certificate_authorities: certs/ca.crt
xpack.security.http.ssl.client_authentication: optional
```
- X-Pack security enables authentication and authorization
- Transport SSL secures inter-node communication
- Certificate verification ensures node authenticity
- HTTP SSL encrypts client-server communication
- Optional client authentication allows mixed authentication modes

### CORS Configuration
```yaml
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: "X-Requested-With,X-Auth-Token,Content-Type,Content-Length,Authorization,Accept,Origin"
http.cors.allow-credentials: true
```
- Enables Cross-Origin Resource Sharing for web clients
- Wildcard origin for development (should be restricted in production)
- Comprehensive header allowlist for API operations
- Credential support for authenticated requests

### HTTP Limits
```yaml
http.max_content_length: 100mb
http.max_header_size: 8kb
http.max_initial_line_length: 4kb
```
- Large content length for bulk operations and large documents
- Header size limits prevent abuse and memory issues
- Initial line length for HTTP request parsing

### Index Management
```yaml
action.auto_create_index: "+ft-transcendence-*,+microservices-logs-*,+game-events-*,+chat-messages-*,+security-events-*,+.monitoring-*,+.watches,+.triggered_watches,+.watcher-history-*,+.ml-*,-.security-*"
action.destructive_requires_name: true
```
- Auto-create patterns for FT Transcendence service indices
- Monitoring and ML indices for operational visibility
- Security index protection prevents accidental deletion
- Destructive operations require explicit index naming

### Logging Configuration
```yaml
logger.level: INFO
logger.org.elasticsearch.transport: WARN
logger.org.elasticsearch.discovery: WARN
logger.org.elasticsearch.cluster.service: WARN
logger.org.elasticsearch.indices.recovery: WARN
logger.org.elasticsearch.snapshots: WARN
```
- INFO level for general operations
- WARN level for noisy components to reduce log volume
- Focused logging for debugging and monitoring

### Monitoring
```yaml
xpack.monitoring.collection.enabled: true
```
- Self-monitoring for cluster health and performance metrics
- Integrates with Prometheus for external monitoring

## Kibana Configuration

### Server Configuration
```yaml
server.name: kibana
server.host: "0.0.0.0"
server.port: ${KIBANA_PORT}
```
- Server identification for logging and monitoring
- Binds to all interfaces for container networking
- Port from environment variable for flexibility

### Elasticsearch Connection
```yaml
elasticsearch.hosts: [ "${ELASTICSEARCH_HOST_PORT}" ]
```
- Elasticsearch cluster endpoint from environment variable
- Supports multiple hosts for high availability

### SSL Configuration
```yaml
server.ssl.enabled: true
server.ssl.certificate: /certs/kibana.crt
server.ssl.key: /certs/kibana.key
server.ssl.certificateAuthorities: [ "/certs/ca.crt" ]
```
- HTTPS enabled for secure web interface access
- X.509 certificate for server authentication
- CA certificate for client trust validation

### Security Keys
```yaml
xpack.security.encryptionKey: C1tHnfrlfxSPxPlQ8BlgPB5qMNRtg5V5
xpack.encryptedSavedObjects.encryptionKey: D12GTfrlfxSPxPlGRBlgPB5qM5GOPDV5
xpack.reporting.encryptionKey: RSCueeHKzrqzOVTJhkjt17EMnzM96LlN
```
- Encryption keys for secured saved objects and sessions
- Reporting encryption for PDF/CSV generation security
- Should be replaced with Vault-managed secrets in production

### Authentication
```yaml
elasticsearch.serviceAccountToken: "${KIBANA_SERVICE_ACCOUNT_TOKEN}"
elasticsearch.ssl.certificateAuthorities: [ "/certs/ca.crt" ]
```
- Service account token for Elasticsearch authentication
- CA certificate for SSL trust establishment

### Fleet Configuration
```yaml
xpack.fleet.packages:
  - name: apm
    version: latest
xpack.fleet.agentPolicies:
  - name: Agent policy 1
    id: agent-policy-1
    namespace: default
    monitoring_enabled:
      - logs
      - metrics
```
- APM package for application performance monitoring
- Agent policy for Elastic Agent management
- Log and metric monitoring enablement

### Performance Settings
```yaml
elasticsearch.requestTimeout: 90000
```
- Extended request timeout for large dataset operations
- Prevents timeouts during heavy query processing

## Logstash Configuration

### Main Configuration File
```yaml
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: ${ELASTICSEARCH_HOST_PORT}
xpack.monitoring.enabled: true
xpack.monitoring.elasticsearch.username: ${ELASTIC_USERNAME}
xpack.monitoring.elasticsearch.password: ${ELASTIC_PASSWORD}
xpack.monitoring.elasticsearch.ssl.certificate_authority: /certs/ca.crt
```
- HTTP endpoint for API access and monitoring
- Self-monitoring integration with Elasticsearch
- Vault-managed credentials for secure authentication
- SSL certificate authority for secure connections

### Pipeline Configuration
```yaml
- pipeline.id: main
  path.config: "/usr/share/logstash/pipeline/main.conf"
  queue.type: memory
```
- Single main pipeline for log processing
- Memory-based queue for optimal performance
- Configuration file path for pipeline rules

### Input Configuration
```properties
input {
  beats {
    port => 5044
  }
}
```
- Beats input plugin for Filebeat connections
- Port 5044 as standard Beats communication port
- Supports multiple concurrent Filebeat connections

### Filter Processing

#### Metadata Addition
```properties
mutate {
  add_field => { "[@metadata][received_at]" => "%{@timestamp}" }
}
```
- Adds processing timestamp for pipeline monitoring
- Metadata field doesn't appear in final output

#### Service Name Extraction
```properties
if [log][file][path] {
  grok {
    match => { 
      "[log][file][path]" => [
        "/var/log/ft-transcendence/(?<extracted_service>[^/]+)/.*",
        "/var/log/nginx/ft-transcendence-(?<extracted_service>[^-]+)-.*",
        "/var/log/(?<extracted_service>nginx)/.*"
      ]
    }
    tag_on_failure => ["_grokparsefailure_service_extraction"]
  }
}
```
- Grok patterns for service identification from log paths
- Multiple patterns for different log sources
- Failure tagging for debugging and monitoring

#### JSON Log Parsing
```properties
if [message] =~ /^\s*\{.*\}\s*$/ {
  json {
    source => "message"
    target => "parsed_json"
    skip_on_invalid_json => true
  }
}
```
- Regex pattern to identify JSON messages
- JSON parsing with error handling
- Target field prevents overwriting of existing fields

#### Field Extraction from JSON
```properties
if [parsed_json][timestamp] {
  mutate { add_field => { "log_timestamp" => "%{[parsed_json][timestamp]}" } }
}
if [parsed_json][level] {
  mutate { add_field => { "log_level" => "%{[parsed_json][level]}" } }
}
if [parsed_json][message] {
  mutate { add_field => { "log_message" => "%{[parsed_json][message]}" } }
}
```
- Conditional field extraction prevents null value issues
- Standardized field names for consistent searching
- Preserves original data structure

#### Request/Response Processing
```properties
if [parsed_json][request] {
  if [parsed_json][request][method] {
    mutate { add_field => { "request_method" => "%{[parsed_json][request][method]}" } }
  }
  if [parsed_json][request][url] {
    mutate { add_field => { "request_url" => "%{[parsed_json][request][url]}" } }
  }
}
```
- Nested object field extraction
- HTTP request metadata preservation
- Facilitates API monitoring and debugging

#### Service-Specific Field Handling
```properties
# Game-specific fields
if [parsed_json][game_id] {
  mutate { add_field => { "game_id" => "%{[parsed_json][game_id]}" } }
}
if [parsed_json][match_id] {
  mutate { add_field => { "match_id" => "%{[parsed_json][match_id]}" } }
}

# Chat-specific fields
if [parsed_json][message_id] {
  mutate { add_field => { "message_id" => "%{[parsed_json][message_id]}" } }
}
if [parsed_json][channel_id] {
  mutate { add_field => { "channel_id" => "%{[parsed_json][channel_id]}" } }
}
```
- Domain-specific field extraction for FT Transcendence services
- Enables specialized dashboards and alerting
- Maintains data relationships for correlation

#### Non-JSON Log Processing
```properties
# Nginx access log pattern
if [logtype] == "api-gateway" {
  grok {
    match => { 
      "message" => "%{COMBINEDAPACHELOG}" 
    }
    tag_on_failure => ["_grokparsefailure_nginx"]
  }
}
```
- Apache Common/Combined log format parsing
- Specific handling for different log types
- Fallback patterns for legacy log formats

#### Data Type Conversion
```properties
if [response_status] {
  mutate {
    convert => { "response_status" => "integer" }
  }
}
if [response_time] {
  mutate {
    convert => { "response_time" => "float" }
  }
}
```
- Ensures proper data types for numerical analysis
- Enables statistical operations and visualizations
- Prevents string comparison issues in queries

#### Service Tagging
```properties
if [service_name] == "auth-service" {
  mutate { add_tag => [ "authentication", "security" ] }
} else if [service_name] == "api-gateway" {
  mutate { add_tag => [ "gateway", "routing" ] }
} else if [service_name] == "chat-service" {
  mutate { add_tag => [ "messaging", "realtime" ] }
}
```
- Categorizes logs by service type for filtering
- Enables tag-based searching and alerting
- Supports operational workflows and incident response

#### Index Name Generation
```properties
if [logtype] == "security-events" {
  mutate {
    add_field => { "[@metadata][index_name]" => "ft-transcendence-security-%{+YYYY.MM.dd}" }
  }
} else if [logtype] == "chat-messages" {
  mutate {
    add_field => { "[@metadata][index_name]" => "ft-transcendence-chat-%{+YYYY.MM.dd}" }
  }
}
```
- Dynamic index naming based on log type
- Date-based index rotation for performance
- Service-specific indices for optimized queries

### Output Configuration
```properties
output {
  elasticsearch {
    hosts => ["https://elasticsearch:9200"]
    user => "${ELASTIC_USERNAME:-elastic}"
    password => "${ELASTIC_PASSWORD:-changeme}"
    ssl_certificate_verification => false
    index => "%{[@metadata][index_name]}"
  }
}
```
- HTTPS connection to Elasticsearch cluster
- Vault-managed credentials with defaults
- SSL verification disabled for self-signed certificates
- Dynamic index routing based on metadata

## Filebeat Configuration

### Input Configuration

#### Chat Messages Collection
```yaml
- type: filestream
  id: chat-messages-logs
  enabled: true
  paths:
    - /var/log/ft-transcendence/chat-service/messages/*.log
    - /var/log/ft-transcendence/chat-service/*.log
  fields:
    logtype: chat-messages
    service: chat-service
    environment: "${ENVIRONMENT:development}"
    service_group: ft-transcendence
    datacenter: "${DATACENTER:local}"
  fields_under_root: true
  json.keys_under_root: false
  json.add_error_key: true
```
- Filestream input for reliable log reading with state management
- Multiple path patterns for comprehensive chat log collection
- Service metadata fields for categorization and filtering
- Environment and datacenter fields for multi-environment deployments
- JSON parsing configuration with error handling

#### Game Events Collection
```yaml
- type: filestream
  id: game-events-logs
  enabled: true
  paths:
    - /var/log/ft-transcendence/game-service/events/*.log
    - /var/log/ft-transcendence/game-service/*.log
  fields:
    logtype: game-events
    service: game-service
```
- Dedicated input for game-related events and logs
- Separate log type for specialized processing and indexing
- Event-driven architecture support for real-time game monitoring

#### Container Log Collection
```yaml
- type: container
  id: docker-logs
  enabled: true
  paths:
    - /var/lib/docker/containers/*/*.log
  stream: all
  processors:
    - script:
        lang: javascript
        id: extract_service_from_container
        source: >
          function process(event) {
            var containerName = event.Get("container.name");
            if (containerName && containerName.startsWith("ft-")) {
              var serviceName = containerName.replace(/^ft-/, "").replace(/-[0-9]+$/, "");
              event.Put("service", serviceName);
            }
          }
```
- Container input type for Docker log collection
- All streams (stdout/stderr) for comprehensive coverage
- JavaScript processor for service name extraction from container names
- FT Transcendence container filtering and naming normalization

### Global Processors
```yaml
processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_docker_metadata:
      host: "unix:///var/run/docker.sock"
  - drop_event:
      when:
        regexp:
          message: "^\\s*$"
  - drop_fields:
      fields: ["agent.ephemeral_id", "agent.id", "ecs.version", "host.architecture", "host.os.family", "host.os.version", "host.os.kernel"]
      ignore_missing: true
```
- Host metadata enrichment for infrastructure context
- Docker metadata from socket for container information
- Empty message filtering reduces noise and storage
- Field cleanup removes unnecessary metadata for optimization

### Output Configuration
```yaml
output.logstash:
  hosts: ["logstash:5044"]
  worker: 1
  compression_level: 3
  timeout: 30s
  bulk_max_size: 512
  ttl: 30s
  pipelining: 2
```
- Logstash output for centralized processing
- Single worker for ordering preservation
- Compression reduces network traffic
- Bulk operations optimize throughput
- Pipelining improves network efficiency

### HTTP Monitoring
```yaml
http.enabled: true
http.host: 0.0.0.0
http.port: 5066
```
- HTTP endpoint for health checks and metrics
- Accessible from all interfaces for monitoring integration
- Standard port for Filebeat monitoring

### Kibana Integration
```yaml
setup.kibana:
  host: "https://kibana:5601"
  protocol: "https"
  ssl.verification_mode: "none"
  username: "${ELASTIC_USERNAME:-elastic}"
  password: "${ELASTIC_PASSWORD:-changeme}"
```
- HTTPS connection to Kibana for dashboard setup
- SSL verification disabled for self-signed certificates
- Vault-managed credentials for authentication

## Vault Integration

### Vault Agent Configuration
The Vault Agent service provides seamless secret management for the entire logging stack:

#### AppRole Authentication
```yaml
secrets:
  logging-role-id:
    external: true
  logging-secret-id:
    external: true
```
- External secrets managed by Docker Swarm secrets
- AppRole method provides secure, automated authentication
- Role-based access control limits secret access scope

#### Secret Template Generation
The Vault Agent uses templates to generate configuration files with injected secrets:

```hcl
template {
  source      = "/vault/config/elasticsearch.env.tpl"
  destination = "/vault/secrets/elasticsearch.env"
  perms       = 0644
}

template {
  source      = "/vault/config/kibana.env.tpl"
  destination = "/vault/secrets/kibana.env"
  perms       = 0644
}
```
- Template-based secret injection ensures consistent formatting
- File permissions restrict access to generated secrets
- Automatic regeneration on secret rotation

#### Secret Rotation and Renewal
- Automatic token renewal prevents authentication failures
- Secret refresh on schedule ensures up-to-date credentials
- Graceful service restart on credential changes

### Secret Distribution
```yaml
volumes:
  vault-logging-secrets:
    driver: local
```
- Shared volume makes secrets available to all logging services
- Local driver ensures secrets remain on the same node
- Read-only mounts prevent accidental secret modification

## Network Architecture

### Network Definitions
```yaml
networks:
  logging-network:
    external: true
  traefik-public:
    external: true
  monitoring-network:
    external: true
  vault-network:
    external: true
```

#### Logging Network
- Dedicated overlay network for log processing services
- Isolates logging traffic from other application networks
- Enables service discovery between Elasticsearch, Logstash, Kibana, and Filebeat

#### Traefik Public Network
- External-facing network for web traffic routing
- Connects Kibana to Traefik reverse proxy
- Enables HTTPS termination and load balancing

#### Monitoring Network
- Shared network with monitoring stack
- Allows metrics collection from logging services
- Integrates logging metrics with Prometheus/Grafana

#### Vault Network
- Secure communication with Vault services
- Encrypted secret retrieval and authentication
- Network-level isolation for sensitive operations

### Service Communication Flow
```
Internet → Traefik → Kibana (logging-network)
                      ↓
                 Elasticsearch (logging-network)
                      ↑
                 Logstash (logging-network)
                      ↑
                 Filebeat (logging-network)
```

## Security Implementation

### TLS/SSL Configuration

#### Certificate Management
```yaml
secrets:
  elastic.ca:
    file: ./../services/devops/logging/secrets/certs/ca/ca.crt
  elasticsearch.certificate:
    file: ./../services/devops/logging/secrets/certs/elasticsearch/elasticsearch.crt
  elasticsearch.key:
    file: ./../services/devops/logging/secrets/certs/elasticsearch/elasticsearch.key
  kibana.certificate:
    file: ./../services/devops/logging/secrets/certs/kibana/kibana.crt
  kibana.key:
    file: ./../services/devops/logging/secrets/certs/kibana/kibana.key
```
- X.509 certificates for each service component
- CA certificate for trust chain validation
- Private keys securely managed through Docker secrets

#### Inter-Service Encryption
- All Elasticsearch communications use HTTPS/TLS
- Transport layer encryption for cluster communication
- Certificate-based authentication between services

### Authentication and Authorization

#### Elasticsearch Security
- X-Pack security enabled for authentication and RBAC
- Service account tokens for service-to-service authentication
- User-based access control for different operational roles

#### Kibana Security
- Integration with Elasticsearch authentication
- Service account for backend operations
- Session encryption for web interface security

### Network Security
- Network segmentation prevents unauthorized access
- Firewall rules through Docker networking
- Service mesh security with encrypted overlay networks

## Monitoring and Health Checks

### Elasticsearch Health Monitoring
```yaml
healthcheck:
  test: ["CMD-SHELL", "set -a && source /vault/secrets/elasticsearch.env && set +a && curl -sf --insecure https://$$ELASTIC_USERNAME:$$ELASTIC_PASSWORD@localhost:$$ELASTICSEARCH_PORT/_cat/health | grep -ioE 'green|yellow' || echo 'not green/yellow cluster status'"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```
- Cluster health API endpoint monitoring
- Authenticated health checks using Vault credentials
- Green/Yellow status validation for operational readiness
- Extended start period accounts for initialization time

### Kibana Health Monitoring
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f https://localhost:5601/api/status -k || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
```
- Status API endpoint for service availability
- HTTPS health check with SSL verification bypass
- Regular interval monitoring for quick failure detection

### Filebeat Health Monitoring
```yaml
healthcheck:
  test: ["CMD-SHELL", "filebeat test config || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```
- Configuration validation for operational readiness
- Built-in test command for comprehensive checks
- Startup grace period for configuration loading

### Metrics Export
- Elasticsearch Exporter provides Prometheus metrics
- cAdvisor monitors container resource usage
- Node Exporter collects system-level metrics
- Integration with monitoring stack for alerting

## Data Flow

### Log Collection Process
1. **Application Logs**: Services write structured JSON logs to mounted volumes
2. **Container Logs**: Docker captures stdout/stderr to container log files
3. **Filebeat Collection**: Filebeat reads logs and enriches with metadata
4. **Logstash Processing**: Logs are parsed, transformed, and routed
5. **Elasticsearch Storage**: Processed logs are indexed for searching
6. **Kibana Visualization**: Users access logs through web dashboards

### Processing Pipeline
```
[Application] → [Log Files] → [Filebeat] → [Logstash] → [Elasticsearch] → [Kibana]
                                   ↓
                             [Metadata Enrichment]
                                   ↓
                             [Service Identification]
                                   ↓
                             [JSON Parsing]
                                   ↓
                             [Index Routing]
```

### Data Transformation
- **Input**: Raw log messages from various sources
- **Enrichment**: Service metadata, timestamps, and context
- **Parsing**: JSON structure extraction and field mapping
- **Routing**: Dynamic index assignment based on log type
- **Output**: Structured, searchable documents in Elasticsearch

## Index Management

### Index Naming Strategy
```properties
ft-transcendence-security-YYYY.MM.dd
ft-transcendence-chat-YYYY.MM.dd
ft-transcendence-game-YYYY.MM.dd
ft-transcendence-gateway-YYYY.MM.dd
ft-transcendence-[service]-YYYY.MM.dd
ft-transcendence-logs-YYYY.MM.dd
```
- Service-specific indices for optimized queries
- Date-based rotation for performance and retention
- Consistent naming pattern for automation

### Index Lifecycle Management
- Daily index rotation reduces search scope
- Automated cleanup of old indices saves storage
- Hot/warm/cold architecture for cost optimization
- Snapshot and restore for disaster recovery

### Search Optimization
- Service-specific indices improve query performance
- Time-based partitioning enables efficient time-range queries
- Field mapping optimization for common search patterns
- Index templates ensure consistent field types

## Troubleshooting

### Common Issues and Solutions

#### Elasticsearch Cluster Issues

**Cluster Red Status**
```bash
# Check cluster health
curl -k -u elastic:password https://elasticsearch:9200/_cat/health

# Check node status
curl -k -u elastic:password https://elasticsearch:9200/_cat/nodes

# Check index status
curl -k -u elastic:password https://elasticsearch:9200/_cat/indices
```

**Memory Issues**
- Verify JVM heap settings in ES_JAVA_OPTS
- Check Docker memory limits and host available memory
- Monitor memory usage with cAdvisor metrics
- Adjust heap size based on available memory

**Certificate Problems**
```bash
# Verify certificate files
docker exec elasticsearch ls -la /certs/

# Check certificate validity
docker exec elasticsearch openssl x509 -in /certs/elasticsearch.crt -text -noout

# Verify CA certificate
docker exec elasticsearch openssl verify -CAfile /certs/ca.crt /certs/elasticsearch.crt
```

#### Logstash Processing Issues

**Pipeline Errors**
```bash
# Check Logstash logs
docker service logs ft-transcendence_logstash

# Test pipeline configuration
docker exec logstash /usr/share/logstash/bin/logstash --config.test_and_exit

# Monitor pipeline stats
curl http://logstash:9600/_node/stats/pipelines
```

**Performance Issues**
- Adjust pipeline batch size and workers
- Monitor memory usage and adjust JVM settings
- Check network latency to Elasticsearch
- Optimize filter patterns and grok expressions

#### Filebeat Collection Issues

**Log Reading Problems**
```bash
# Check Filebeat logs
docker service logs ft-transcendence_filebeat-logging

# Verify log file access
docker exec filebeat ls -la /var/log/ft-transcendence/

# Check Filebeat registry
docker exec filebeat cat /usr/share/filebeat/data/registry/filebeat/meta.json
```

**Connection Issues**
- Verify Logstash connectivity on port 5044
- Check network connectivity between services
- Monitor Filebeat metrics endpoint
- Validate Elasticsearch authentication

#### Kibana Access Issues

**Authentication Problems**
```bash
# Check Kibana logs
docker service logs ft-transcendence_kibana

# Verify Elasticsearch connection
curl -k -u elastic:password https://elasticsearch:9200/_cat/health

# Test Kibana status
curl -k https://kibana:5601/api/status
```

**Dashboard Loading Issues**
- Verify index patterns are created
- Check Elasticsearch index permissions
- Monitor Kibana initialization logs
- Validate time field configuration

#### Vault Integration Issues

**Secret Access Problems**
```bash
# Check Vault Agent logs
docker service logs ft-transcendence_vault-agent-logging

# Verify secret files
docker exec vault-agent-logging ls -la /vault/secrets/

# Test AppRole authentication
vault auth -method=approle role_id=xxx secret_id=yyy
```

**Token Renewal Issues**
- Monitor Vault Agent token renewal logs
- Check AppRole policy permissions
- Verify network connectivity to Vault server
- Validate secret template configurations

### Performance Optimization

#### Elasticsearch Tuning
- Adjust JVM heap size to 50% of available memory
- Configure appropriate refresh intervals for indices
- Optimize mapping templates for field types
- Use index templates for consistent configuration

#### Logstash Optimization
- Tune pipeline worker threads and batch sizes
- Optimize filter patterns for processing efficiency
- Use conditional processing to reduce overhead
- Monitor queue sizes and processing rates

#### Network Optimization
- Use compression for log shipping
- Optimize batch sizes for network efficiency
- Monitor network latency and bandwidth usage
- Consider regional deployment for distributed systems

### Monitoring and Alerting

#### Key Metrics to Monitor
- Elasticsearch cluster health and node status
- Index creation and deletion rates
- Logstash pipeline processing rates and errors
- Filebeat harvest rates and errors
- Kibana response times and error rates

#### Alert Conditions
- Elasticsearch cluster status changes to yellow/red
- High log processing latency
- Failed authentication attempts
- Disk space usage thresholds
- Memory usage exceeding limits

#### Log Analysis Patterns
- Error rate increases by service
- Unusual authentication activity
- Performance degradation patterns
- Security event correlations
- Service dependency failures
