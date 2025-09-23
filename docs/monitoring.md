#  Monitoring Stack Documentation: Complete Guide

This comprehensive guide covers the entire monitoring infrastructure for the FT Transcendence project, explaining every component, configuration, and line of code in detail.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Docker Compose Configuration](#docker-compose-configuration)
4. [Prometheus Configuration](#prometheus-configuration)
5. [Grafana Configuration](#grafana-configuration)
6. [Alertmanager Configuration](#alertmanager-configuration)
7. [Alert Rules](#alert-rules)
8. [Exporters & Data Collection](#exporters--data-collection)
9. [Security & Vault Integration](#security--vault-integration)
10. [Networking & Service Discovery](#networking--service-discovery)
11. [Data Persistence](#data-persistence)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Best Practices](#best-practices)

---

## Architecture Overview

### Monitoring Stack Components

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FT Transcendence Monitoring Stack            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Data Sources  │   Collection    │      Visualization         │
│                 │   & Storage     │      & Alerting            │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ • Node Exporter │ • Prometheus    │ • Grafana                   │
│ • cAdvisor      │   (TSDB)        │   (Dashboards)              │
│ • App Metrics   │ • Service       │ • Alertmanager              │
│ • Infrastructure│   Discovery     │   (Notifications)           │
│ • Docker Daemon │ • Scraping      │ • Discord Integration       │
│ • Nginx         │ • Retention     │ • Web Interfaces            │
│ • PostgreSQL    │ • Aggregation   │ • Query Interface           │
│ • Redis         │                 │                             │
│ • Elasticsearch │                 │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### Data Flow

1. **Collection**: Exporters gather metrics from various sources
2. **Ingestion**: Prometheus scrapes metrics from exporters
3. **Storage**: Time-series data stored in Prometheus TSDB
4. **Visualization**: Grafana queries Prometheus for dashboard displays
5. **Alerting**: Prometheus evaluates rules and sends alerts to Alertmanager
6. **Notification**: Alertmanager routes alerts to Discord webhook

### Network Architecture

- **monitoring-network**: Internal communication between monitoring components
- **traefik-public**: External access through reverse proxy
- **vault-network**: Secure access to HashiCorp Vault for secrets
- **logging-network**: Integration with ELK stack for log correlation

---

## Core Components

### 1. Prometheus (Metrics Collection & Storage)

**Purpose**: Central metrics collection, storage, and alerting engine

**Key Features**:

- Time-series database with efficient storage
- Pull-based metric collection model
- Powerful query language (PromQL)
- Built-in alerting capabilities
- Service discovery for dynamic environments

### 2. Grafana (Visualization & Dashboards)

**Purpose**: Web-based analytics and interactive visualization platform

**Key Features**:

- Rich dashboard creation with multiple data sources
- Advanced query editor and visualization options
- User management and access control
- Alert visualization and management
- Plugin ecosystem for extended functionality

### 3. Alertmanager (Alert Management)

**Purpose**: Handles alerts sent by Prometheus server

**Key Features**:

- Alert deduplication and grouping
- Notification routing to various channels
- Silencing and inhibition rules
- High availability clustering
- Template-based notification formatting

### 4. Node Exporter (System Metrics)

**Purpose**: Collects hardware and OS metrics from Linux systems

**Metrics Collected**:

- CPU usage, load average, temperature
- Memory and swap utilization
- Disk I/O, filesystem usage
- Network interface statistics
- System load and process information

### 5. cAdvisor (Container Metrics)

**Purpose**: Analyzes resource usage and performance of running containers

**Metrics Collected**:
- Container CPU, memory, and network usage
- Filesystem statistics per container
- Process information within containers
- Historical resource usage data
- Container lifecycle events

### 6. Vault Agent (Secret Management)

**Purpose**: Securely provides credentials and configuration to monitoring services

**Features**:
- Automatic secret renewal
- Template rendering for configuration files
- Secure credential injection
- Audit logging for secret access

---

## Docker Compose Configuration

### Complete Service Breakdown

#### Vault Agent for Monitoring

```yaml
vault-agent-monitoring:
  image: ft_transcendence/vault
  user: root
  deploy:
    replicas: 1
    placement:
      constraints: 
        - node.labels.type == monitoring  # Ensures deployment on monitoring nodes
    restart_policy:
      condition: on-failure             # Restart only if container fails
      delay: 10s                        # Wait 10 seconds before restart
    resources:
      limits:
        memory: 256M                    # Maximum memory allocation
      reservations:
        memory: 128M                    # Guaranteed memory allocation
  cap_add:
    - IPC_LOCK                          # Required for Vault to lock memory pages
  volumes:
    - vault-monitoring-secrets:/vault/secrets        # Shared secrets volume
    - vault-monitoring-agent-data:/vault/agent/data  # Agent state persistence
  configs:
    - source: vault-agent-monitoring-config
      target: /vault/config/vault-agent.hcl  # Agent configuration file
  networks:
    - vault-network                     # Access to Vault server
    - monitoring-network                # Access to monitoring services
  secrets:
    - source: monitoring-role-id        # AppRole authentication
      target: /tmp/monitoring-role-id
      mode: 0644
    - source: monitoring-secret-id      # AppRole secret
      target: /tmp/monitoring-secret-id
      mode: 0644
  environment:
    - VAULT_ADDR=http://vault:8200      # Vault server address
    - VAULT_SKIP_VERIFY=true            # Skip TLS verification (internal network)
  command: ["vault", "agent", "-config=/vault/config/vault-agent.hcl"]
  healthcheck:
    test: ["CMD-SHELL", "test -f /vault/secrets/grafana.env && test -f /vault/secrets/prometheus.env"]
    interval: 30s                       # Check every 30 seconds
    timeout: 10s                        # Timeout after 10 seconds
    retries: 5                          # Allow 5 consecutive failures
    start_period: 60s                   # Grace period during startup
```

#### Prometheus Configuration

```yaml
prometheus:
  image: ft_transcendence/prometheus
  deploy:
    replicas: 1                         # Single instance (no HA in this setup)
    placement:
      constraints: 
        - node.labels.type == monitoring  # Run on designated monitoring node
    restart_policy:
      condition: on-failure
      delay: 5s                         # Quick restart for critical service
    resources:
      limits:
        memory: 2G                      # High memory for time-series storage
      reservations:
        memory: 1G                      # Guaranteed memory allocation
    labels:
      # Traefik configuration for external access
      - "traefik.enable=true"
      - "traefik.constraint-label=traefik-public"
      - "traefik.http.routers.prometheus.rule=Host(`prometheus.ft-transcendence.com`)"
      - "traefik.http.routers.prometheus.entrypoints=websecure"
      - "traefik.http.routers.prometheus.tls=true"
      - "traefik.http.services.prometheus.loadbalancer.server.port=9090"
      - "traefik.http.routers.prometheus.middlewares=prometheus-auth@file,security-headers@file"
      - "traefik.docker.network=traefik-public"
      # HTTP to HTTPS redirect configuration
      - "traefik.http.routers.prometheus-http.rule=Host(`prometheus.ft-transcendence.com`)"
      - "traefik.http.routers.prometheus-http.entrypoints=web"
      - "traefik.http.routers.prometheus-http.middlewares=redirect-to-https"
      - "traefik.http.routers.prometheus-http.tls=false"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
  ports:
    - "9090:9090"                       # Direct port access (also via Traefik)
  volumes:
    - prometheus-data:/prometheus       # Persistent storage for time-series data
    - prometheus-config:/etc/prometheus # Configuration files
    - /var/run/docker.sock:/var/run/docker.sock  # Docker API access for service discovery
    - vault-monitoring-secrets:/vault/secrets:ro  # Read-only access to secrets
  networks:
    - traefik-public                    # External access through Traefik
    - monitoring-network                # Communication with other monitoring services
    - logging-network                   # Access to ELK stack for metrics
  depends_on:
    - vault-agent-monitoring            # Wait for secrets to be available
  entrypoint: |
    bash -c "
      echo 'Waiting for vault secrets...';
      while [ ! -f /vault/secrets/prometheus.env ]; do 
        echo 'Waiting for prometheus.env from vault...'; 
        sleep 5; 
      done;
      echo 'Vault secrets found, sourcing environment variables...';
      set -a && . /vault/secrets/prometheus.env && set +a;
      echo 'Environment variables loaded, starting Prometheus...';
      exec /bin/prometheus 
        --config.file=/etc/prometheus/prometheus.yml 
        --storage.tsdb.path=/prometheus 
        --storage.tsdb.retention.time=30d 
        --storage.tsdb.retention.size=10GB 
        --web.console.libraries=/etc/prometheus/console_libraries 
        --web.console.templates=/etc/prometheus/consoles 
        --web.enable-lifecycle 
        --web.enable-admin-api 
        --log.level=info 
        --web.external-url=https://prometheus.ft-transcendence.com
    "
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

**Prometheus Startup Parameters Explained**:

- `--config.file`: Main configuration file location
- `--storage.tsdb.path`: Directory for time-series database storage
- `--storage.tsdb.retention.time=30d`: Keep data for 30 days
- `--storage.tsdb.retention.size=10GB`: Maximum storage size
- `--web.console.libraries`: Console library files location
- `--web.console.templates`: Console template files location
- `--web.enable-lifecycle`: Allow runtime configuration reload via API
- `--web.enable-admin-api`: Enable administrative API endpoints
- `--log.level=info`: Logging verbosity level
- `--web.external-url`: External URL for proper redirect handling

#### Grafana Configuration

```yaml
grafana:
  image: ft_transcendence/grafana
  ports:
    - "3000:3000"                       # Grafana web interface
  deploy:
    replicas: 1
    placement:
      constraints: 
        - node.labels.type == monitoring
    restart_policy:
      condition: on-failure
      delay: 5s
    resources:
      limits:
        memory: 1G                      # Sufficient memory for dashboards
      reservations:
        memory: 512M
    labels:
      # Traefik configuration
      - "traefik.enable=true"
      - "traefik.constraint-label=traefik-public"
      - "traefik.http.routers.grafana.rule=Host(`monitoring.ft-transcendence.com`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.routers.grafana.tls=true"
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"
      - "traefik.http.routers.grafana.middlewares=security-headers@file"
      - "traefik.docker.network=traefik-public"
      # HTTP to HTTPS redirect
      - "traefik.http.routers.grafana-http.rule=Host(`monitoring.ft-transcendence.com`)"
      - "traefik.http.routers.grafana-http.entrypoints=web"
      - "traefik.http.routers.grafana-http.middlewares=redirect-to-https"
      - "traefik.http.routers.grafana-http.tls=false"
  volumes:
    - grafana-data:/var/lib/grafana     # Persistent storage for dashboards, users, etc.
    - grafana-provisioning:/etc/grafana/provisioning  # Automated configuration
    - grafana-dashboards:/var/lib/grafana/dashboards  # Dashboard definitions
    - vault-monitoring-secrets:/vault/secrets:ro       # Access to credentials
  networks:
    - traefik-public
    - monitoring-network
  environment:
    # Security settings
    - GF_USERS_ALLOW_SIGN_UP=false     # Disable public registration
    - GF_USERS_ALLOW_ORG_CREATE=false  # Disable organization creation
    # Path configurations
    - GF_PATHS_PROVISIONING=/etc/grafana/provisioning  # Auto-provisioning directory
    - GF_PATHS_DATA=/var/lib/grafana    # Data directory
    # Logging and analytics
    - GF_LOG_LEVEL=info                 # Log verbosity
    - GF_ANALYTICS_REPORTING_ENABLED=false  # Disable usage reporting
    - GF_ANALYTICS_CHECK_FOR_UPDATES=false  # Disable update checks
    # Security enhancements
    - GF_SECURITY_DISABLE_GRAVATAR=true     # Disable Gravatar integration
    - GF_SNAPSHOTS_EXTERNAL_ENABLED=false   # Disable external snapshots
    # Server configuration
    - GF_SERVER_ROOT_URL=https://monitoring.ft-transcendence.com
    - GF_SERVER_SERVE_FROM_SUB_PATH=false   # Serve from root path
    - GF_SERVER_DOMAIN=monitoring.ft-transcendence.com
    - GF_SERVER_ENABLE_GZIP=true            # Enable compression
    # Additional security headers
    - GF_SECURITY_CONTENT_TYPE_PROTECTION=true
    - GF_SECURITY_X_CONTENT_TYPE_OPTIONS=nosniff
    - GF_SECURITY_X_XSS_PROTECTION=true
  depends_on:
    - vault-agent-monitoring
    - prometheus                        # Ensure Prometheus is available as data source
  command: ["/bin/bash", "-c", "set -a && source /vault/secrets/grafana.env && set +a && /run.sh"]
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

#### Node Exporter Configuration

```yaml
node-exporter-monitoring:
  image: prom/node-exporter:v1.8.2
  deploy:
    mode: global                        # Run on every node in the cluster
    placement:
      constraints: 
        - node.labels.type == monitoring  # Only on monitoring nodes in this case
    restart_policy:
      condition: on-failure
      delay: 5s
    resources:
      limits:
        memory: 128M                    # Lightweight resource usage
      reservations:
        memory: 64M
  volumes:
    # Read-only access to host filesystem for metrics collection
    - /proc:/host/proc:ro               # Process information
    - /sys:/host/sys:ro                 # System information
    - /:/rootfs:ro                      # Root filesystem information
  networks:
    - monitoring-network
  command:
    - '--path.procfs=/host/proc'        # Path to host proc filesystem
    - '--path.rootfs=/rootfs'           # Path to host root filesystem
    - '--path.sysfs=/host/sys'          # Path to host sys filesystem
    - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'  # Ignore virtual filesystems
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9100/metrics"]
    interval: 30s
    timeout: 10s
    retries: 3
```

#### cAdvisor Configuration

```yaml
cadvisor-monitoring:
  image: gcr.io/cadvisor/cadvisor:v0.52.1
  deploy:
    mode: global                        # Run on every node for container monitoring
    placement:
      constraints: 
        - node.labels.type == monitoring
    restart_policy:
      condition: on-failure
      delay: 5s
    resources:
      limits:
        memory: 256M                    # Higher memory for container analysis
      reservations:
        memory: 128M
  volumes:
    # Required volumes for container monitoring
    - /:/rootfs:ro                      # Host filesystem access
    - /var/run:/var/run:ro              # Runtime information
    - /sys:/sys:ro                      # System information
    - /var/lib/docker/:/var/lib/docker:ro  # Docker runtime data
    - /dev/disk/:/dev/disk:ro           # Disk information
  networks:
    - monitoring-network
  command:
    - '--housekeeping_interval=30s'    # How often to perform housekeeping
    - '--docker_only=true'              # Only monitor Docker containers
    - '--disable_metrics=cpu_topology,disk,memory_numa,tcp,udp,percpu,sched,process,hugetlb,referenced_memory,resctrl,cpuset,advtcp'  # Disable unnecessary metrics
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/healthz"]
    interval: 30s
    timeout: 10s
    retries: 3
```

#### Alertmanager Configuration

```yaml
alertmanager:
  image: prom/alertmanager:v0.23.0
  ports:
    - "9093:9093"
  deploy:
    replicas: 1
    placement:
      constraints: 
        - node.labels.type == monitoring
    restart_policy:
      condition: on-failure
      delay: 10s
    resources:
      limits:
        memory: 256M                    # Lightweight alerting service
      reservations:
        memory: 128M
    labels:
      # Traefik configuration for web UI access
      - "traefik.enable=true"
      - "traefik.constraint-label=traefik-public"
      - "traefik.http.routers.alertmanager.rule=Host(`alertmanager.ft-transcendence.com`)"
      - "traefik.http.routers.alertmanager.entrypoints=websecure"
      - "traefik.http.routers.alertmanager.tls=true"
      - "traefik.http.services.alertmanager.loadbalancer.server.port=9093"
      - "traefik.http.routers.alertmanager.middlewares=alertmanager-auth@file,security-headers@file"
      - "traefik.docker.network=traefik-public"
  volumes:
    - ./../services/devops/monitoring/prometheus/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    - alertmanager-config:/etc/alertmanager
  networks:
    - traefik-public
    - monitoring-network
  command:
    - '--config.file=/etc/alertmanager/alertmanager.yml'  # Configuration file location
    - '--log.level=debug'               # Debug logging for troubleshooting
    - '--cluster.advertise-address=0.0.0.0:9093'  # Cluster advertisement address
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9093/-/healthy"]
    interval: 30s
    timeout: 10s
    retries: 3
```

#### Discord Integration Service

```yaml
alertmanager-discord:
  image: benjojo/alertmanager-discord:latest
  ports:
    - "9094:9094"
  deploy:
    replicas: 1
    placement:
      constraints:
        - node.labels.type == monitoring
    restart_policy:
      condition: on-failure
      delay: 10s
    resources:
      limits:
        memory: 256M
      reservations:
        memory: 128M
  environment:
    # Discord webhook URL for alert notifications
    - DISCORD_WEBHOOK=https://discord.com/api/webhooks/1409239253258469386/lkc0VOIh7zlmRFdaenMARB3Ak1HUFhFMu4WRpsObCrTJAhSJwScS3Jt09mHkI86nyt8r
  networks:
    - monitoring-network
```

---

## Prometheus Configuration Details

### Main Configuration File (`prometheus.yml`)

```yaml
global:
  scrape_interval: 15s                 # How frequently to scrape targets
  evaluation_interval: 15s             # How frequently to evaluate rules
  external_labels:
    cluster: 'ft-transcendence'        # External label for federation/remote storage
```

**Global Configuration Explained**:
- `scrape_interval`: Default interval for collecting metrics from all targets
- `evaluation_interval`: How often Prometheus evaluates alert rules
- `external_labels`: Labels added to all metrics when federating or remote storage

### Rule Files

```yaml
rule_files:
  - "/etc/prometheus/rules/alerts.yml"  # Location of alerting rules
```

### Alerting Configuration

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - 'alertmanager:9093'      # Alertmanager service endpoint
```

### Scrape Configurations

#### Self-Monitoring

```yaml
- job_name: 'prometheus'
  static_configs:
    - targets: ['localhost:9090']      # Monitor Prometheus itself
  scrape_interval: 5s                  # More frequent scraping for self-monitoring
```

#### Docker Swarm Service Discovery

```yaml
- job_name: 'docker-swarm-services'
  dockerswarm_sd_configs:
    - host: unix:///var/run/docker.sock  # Docker socket for service discovery
      role: services                     # Discover Docker Swarm services
      port: 9323                        # Default port for Docker daemon metrics
  relabel_configs:
    - source_labels: [__meta_dockerswarm_service_name]
      target_label: service_name        # Add service name as label
    - source_labels: [__meta_dockerswarm_service_label_com_docker_stack_namespace]
      target_label: stack_name          # Add stack name as label
```

#### Docker Swarm Node Discovery

```yaml
- job_name: 'docker-swarm-nodes'
  dockerswarm_sd_configs:
    - host: unix:///var/run/docker.sock
      role: nodes                       # Discover Docker Swarm nodes
      port: 9100                        # Default Node Exporter port
  relabel_configs:
    - source_labels: [__meta_dockerswarm_node_hostname]
      target_label: node_name           # Add node hostname as label
    - source_labels: [__meta_dockerswarm_node_role]
      target_label: node_role           # Add node role (manager/worker) as label
```

#### Infrastructure Services

```yaml
# Nginx metrics
- job_name: 'nginx'
  static_configs:
    - targets: ['nginx-exporter:9113']  # Nginx Prometheus exporter
  metrics_path: '/metrics'              # Metrics endpoint path
  scrape_interval: 10s                  # Frequent scraping for web server metrics

# Redis metrics
- job_name: 'redis'
  static_configs:
    - targets: ['redis-exporter:9121']  # Redis exporter
  metrics_path: '/metrics'
  scrape_interval: 15s

# Elasticsearch metrics
- job_name: 'elasticsearch-exporter'
  static_configs:
    - targets: ['elasticsearch-exporter:9114']  # Elasticsearch exporter
  metrics_path: '/metrics'
  scrape_interval: 15s
```

#### System and Container Metrics

```yaml
# System metrics from all nodes
- job_name: 'node-exporter'
  static_configs:
    - targets:
        - 'node-exporter-manager:9100'     # Manager node system metrics
        - 'node-exporter-logging:9100'     # Logging node system metrics
        - 'node-exporter-monitoring:9100'  # Monitoring node system metrics
  scrape_interval: 10s                    # Frequent system monitoring

# Container metrics from all nodes
- job_name: 'cadvisor'
  static_configs:
    - targets:
        - 'cadvisor-manager:8080'          # Manager node container metrics
        - 'cadvisor-logging:8080'          # Logging node container metrics
        - 'cadvisor-monitoring:8080'       # Monitoring node container metrics
  scrape_interval: 10s                    # Frequent container monitoring
  metrics_path: '/metrics'
```

---

## Grafana Configuration Details

### Data Source Configuration (`prometheus.yml`)

```yaml
apiVersion: 1

datasources:
  - name: Prometheus                    # Primary data source name
    type: prometheus                    # Data source type
    access: proxy                       # Access mode (proxy/direct)
    url: http://prometheus:9090         # Prometheus server URL
    isDefault: true                     # Set as default data source
    editable: true                      # Allow editing in UI
    jsonData:
      timeInterval: "5s"                # Minimum time interval for queries
      queryTimeout: "60s"               # Query timeout duration
      httpMethod: "GET"                 # HTTP method for queries
    secureJsonData: {}                  # Secure settings (empty for internal services)

  - name: Elasticsearch                # Secondary data source for logs
    type: elasticsearch                 # Elasticsearch data source type
    access: proxy                       # Proxy access through Grafana
    url: https://elasticsearch:9200     # Elasticsearch cluster URL
    database: "filebeat-*"              # Index pattern for log data
    editable: true                      # Allow editing in UI
    jsonData:
      esVersion: 8                      # Elasticsearch version
      timeField: "@timestamp"           # Time field for log entries
      interval: "Daily"                 # Index rotation interval
      maxConcurrentShardRequests: 5     # Limit concurrent shard requests
      httpMode: "POST"                  # HTTP method for queries
      tlsSkipVerify: false              # Verify TLS certificates
      basicAuth: true                   # Enable basic authentication
    secureJsonData:
      basicAuthPassword: ${ELASTICSEARCH_PASSWORD:-changeme}  # Password from Vault
      basicAuthUser: ${ELASTICSEARCH_USER:-elastic}           # Username from Vault
```

**Grafana Data Source Configuration Explained**:

**Prometheus Settings**:
- `access: proxy`: Grafana acts as proxy for browser requests to Prometheus
- `timeInterval: "5s"`: Minimum resolution for time-based queries
- `queryTimeout: "60s"`: Maximum time allowed for query execution
- `httpMethod: "GET"`: Use HTTP GET for Prometheus queries (standard)

**Elasticsearch Settings**:
- `database: "filebeat-*"`: Index pattern matching Filebeat log indices
- `esVersion: 8`: Elasticsearch version for compatibility
- `timeField: "@timestamp"`: Field used for time-based filtering
- `interval: "Daily"`: How frequently indices rotate
- `maxConcurrentShardRequests: 5`: Limit parallel shard queries to prevent overload
- `basicAuth: true`: Use username/password authentication

### Environment Variables from Vault

Grafana receives the following environment variables through Vault secrets:

```bash
# From /vault/secrets/grafana.env
GF_SECURITY_ADMIN_USER=admin           # Admin username
GF_SECURITY_ADMIN_PASSWORD=<secure>    # Admin password
GF_DATABASE_URL=<connection_string>     # Database connection (if using external DB)
ELASTICSEARCH_USER=elastic              # Elasticsearch username
ELASTICSEARCH_PASSWORD=<secure>         # Elasticsearch password
```

---

## Alertmanager Configuration Details

### Main Configuration (`alertmanager.yml`)

```yaml
route:
  receiver: 'discord_webhook'           # Default receiver for all alerts
  repeat_interval: 4h                   # How often to resend unresolved alerts
  group_by: [alertname]                 # Group alerts by alert name
  group_wait: 10s                       # Wait time before sending initial group
  group_interval: 5m                    # Wait time before sending additional alerts in group

receivers:
  - name: 'discord_webhook'             # Receiver definition
    webhook_configs:
      - url: 'https://discord.com/api/webhooks/1409239253258469386/lkc0VOIh7zlmRFdaenMARB3Ak1HUFhFMu4WRpsObCrTJAhSJwScS3Jt09mHkI86nyt8r'
        send_resolved: true             # Send notification when alert resolves
        title: 'FT Transcendence Alert' # Title for Discord messages
        http_config:
          timeout: 10s                  # HTTP request timeout
```

**Alertmanager Configuration Explained**:

**Routing Configuration**:
- `receiver`: Which receiver handles alerts that match this route
- `repeat_interval`: Prevents spam by limiting resend frequency
- `group_by`: Combines related alerts into single notification
- `group_wait`: Prevents rapid-fire notifications for burst of alerts
- `group_interval`: Batches additional alerts in same group

**Webhook Configuration**:
- `url`: Discord webhook endpoint for notifications
- `send_resolved`: Notifies when problems are fixed
- `title`: Static title for all alert messages
- `timeout`: Prevents hanging on slow webhook responses

---

## Alert Rules

### Alert Rule Categories

#### Service Availability Alerts

```yaml
- alert: ServiceDown
  expr: up == 0                         # Target is unreachable
  for: 1m                              # Must be down for 1 minute
  labels:
    severity: critical                  # High priority alert
  annotations:
    summary: "Service {{ $labels.job }} is down"
    description: "Service {{ $labels.job }} on {{ $labels.instance }} has been down for more than 1 minute."
```

#### Application Performance Alerts

```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1  # 5xx errors > 0.1/sec
  for: 2m                              # Sustained high error rate
  labels:
    severity: warning                   # Medium priority
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors per second for {{ $labels.job }}"
```

#### System Resource Alerts

```yaml
- alert: HighCPUUsage
  expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 5m                              # Sustained high CPU usage
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage on {{ $labels.instance }}"
    description: "CPU usage is above 80% for more than 5 minutes on {{ $labels.instance }}"

- alert: HighMemoryUsage
  expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
  for: 5m                              # High memory utilization
  labels:
    severity: warning
  annotations:
    summary: "High memory usage on {{ $labels.instance }}"
    description: "Memory usage is above 85% for more than 5 minutes on {{ $labels.instance }}"

- alert: LowDiskSpace
  expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 90
  for: 5m                              # Critical disk space
  labels:
    severity: critical
  annotations:
    summary: "Low disk space on {{ $labels.instance }}"
    description: "Disk usage is above 90% on {{ $labels.instance }} ({{ $labels.mountpoint }})"
```

#### Docker Swarm Alerts

```yaml
- alert: SwarmNodeDown
  expr: swarm_node_info{state!="ready"} == 1  # Node not in ready state
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Swarm node {{ $labels.node_name }} is down"
    description: "Docker Swarm node {{ $labels.node_name }} is not in ready state"

- alert: ServiceReplicasMismatch
  expr: swarm_service_replicas != swarm_service_replicas_running  # Desired vs actual replicas
  for: 3m
  labels:
    severity: warning
  annotations:
    summary: "Service {{ $labels.service_name }} has replica mismatch"
    description: "Service {{ $labels.service_name }} desired: {{ $labels.replicas }}, running: {{ $labels.replicas_running }}"
```

#### Application-Specific Alerts

```yaml
- alert: FrontendDown
  expr: up{job="ft-transcendence-frontend"} == 0  # Frontend service unavailable
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Frontend service is down"
    description: "The frontend service has been unreachable for more than 1 minute"

- alert: user-serviceDown
  expr: up{job="ft-transcendence-user-service"} == 0  # User service unavailable
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "User service is down"
    description: "The user service has been unreachable for more than 1 minute"
```

**Alert Rule Components Explained**:

- `expr`: PromQL expression that defines when alert fires
- `for`: Duration condition must be true before firing
- `labels`: Metadata attached to alert (used for routing)
- `annotations`: Human-readable information about the alert
- `{{ $labels.xxx }}`: Template variables from metric labels
- `{{ $value }}`: Current value of the expression

---

## Exporters & Data Collection

### Node Exporter Metrics

**System Metrics Collected**:

```prometheus
# CPU Metrics
node_cpu_seconds_total              # CPU time spent in each mode
node_load1, node_load5, node_load15 # System load averages

# Memory Metrics
node_memory_MemTotal_bytes          # Total system memory
node_memory_MemAvailable_bytes      # Available memory for applications
node_memory_MemFree_bytes           # Free memory
node_memory_Buffers_bytes           # Buffer cache memory
node_memory_Cached_bytes            # Page cache memory

# Disk Metrics
node_filesystem_size_bytes          # Filesystem total size
node_filesystem_avail_bytes         # Filesystem available space
node_filesystem_free_bytes          # Filesystem free space
node_disk_io_time_seconds_total     # Disk I/O time
node_disk_reads_completed_total     # Completed read operations
node_disk_writes_completed_total    # Completed write operations

# Network Metrics
node_network_receive_bytes_total    # Network bytes received
node_network_transmit_bytes_total   # Network bytes transmitted
node_network_receive_packets_total  # Network packets received
node_network_transmit_packets_total # Network packets transmitted

# System Information
node_uname_info                     # System information (kernel, hostname)
node_boot_time_seconds              # System boot time
node_time_seconds                   # Current system time
```

### cAdvisor Container Metrics

**Container Metrics Collected**:

```prometheus
# CPU Metrics
container_cpu_usage_seconds_total   # Total CPU time consumed
container_cpu_system_seconds_total  # CPU time spent in system mode
container_cpu_user_seconds_total    # CPU time spent in user mode

# Memory Metrics
container_memory_usage_bytes        # Current memory usage
container_memory_max_usage_bytes    # Maximum memory usage recorded
container_memory_cache              # Memory used for cache
container_memory_rss                # Memory in resident set size

# Network Metrics
container_network_receive_bytes_total    # Network bytes received
container_network_transmit_bytes_total   # Network bytes transmitted
container_network_receive_packets_total  # Network packets received
container_network_transmit_packets_total # Network packets transmitted

# Filesystem Metrics
container_fs_usage_bytes            # Filesystem usage
container_fs_limit_bytes            # Filesystem limit
container_fs_reads_total            # Filesystem read operations
container_fs_writes_total           # Filesystem write operations

# Container Information
container_start_time_seconds        # Container start time
container_last_seen                 # Last time container was seen
```

### Custom Application Metrics

Applications can expose custom metrics for monitoring:

```prometheus
# HTTP Request Metrics
http_requests_total{method="GET",status="200"}    # Total HTTP requests
http_request_duration_seconds                     # Request duration histogram

# Business Logic Metrics
ft_transcendence_active_users                     # Number of active users
ft_transcendence_games_in_progress                # Number of active games
ft_transcendence_messages_sent_total              # Total messages sent

# Database Metrics
ft_transcendence_db_connections_active            # Active database connections
ft_transcendence_db_query_duration_seconds        # Database query duration
```

---

## Security & Vault Integration

### Vault Agent Configuration

The monitoring stack uses Vault Agent for secure secret management:

```hcl
# vault-agent.hcl (conceptual structure)
vault {
  address = "http://vault:8200"
  retry {
    num_retries = 5
  }
}

auto_auth {
  method "approle" {
    config = {
      role_id_file_path = "/tmp/monitoring-role-id"
      secret_id_file_path = "/tmp/monitoring-secret-id"
    }
  }
  
  sink "file" {
    config = {
      path = "/vault/secrets/.vault-token"
    }
  }
}

template {
  source      = "/vault/config/grafana.env.tpl"
  destination = "/vault/secrets/grafana.env"
}

template {
  source      = "/vault/config/prometheus.env.tpl"
  destination = "/vault/secrets/prometheus.env"
}
```

### Secret Management

**Secrets Managed by Vault**:

- **Grafana Admin Credentials**: Admin username and password
- **Database Credentials**: PostgreSQL connection strings
- **Elasticsearch Credentials**: Authentication for log access
- **External API Keys**: Third-party service authentication
- **TLS Certificates**: SSL/TLS certificates for HTTPS

**Security Benefits**:
- **Dynamic Secret Generation**: Credentials automatically generated and rotated
- **Audit Logging**: All secret access logged for security monitoring
- **Time-Limited Access**: Secrets have expiration times
- **Encrypted Storage**: All secrets encrypted at rest and in transit
- **Fine-Grained Access**: Role-based access to specific secrets

### Network Security

**Network Segmentation**:

```yaml
networks:
  monitoring-network:     # Internal monitoring communication
    driver: overlay
    encrypted: true       # Network traffic encryption
  
  traefik-public:        # External access through reverse proxy
    external: true
  
  vault-network:         # Secure access to Vault
    external: true
    encrypted: true
```

**Access Control**:
-  **Traefik Authentication**: HTTP basic auth for Prometheus and Alertmanager
-  **Network Isolation**: Services only accessible through designated networks
-  **TLS Termination**: HTTPS enforced for all external access
-  **Internal DNS**: Service discovery prevents IP-based attacks

---

## Networking & Service Discovery

### Network Topology

```text
External Users
      │
      ▼
┌─────────────┐
│   Traefik   │ ◄─── traefik-public network
│ (Reverse    │
│  Proxy)     │
└─────────────┘
      │
      ▼
┌─────────────┐
│ Monitoring  │ ◄─── monitoring-network
│ Services    │
│ • Grafana   │ ◄─── vault-network (for secrets)
│ • Prometheus│
│ • AlertMgr  │ ◄─── logging-network (for log metrics)
└─────────────┘
      │
      ▼
┌─────────────┐
│ Exporters   │
│ • Node      │
│ • cAdvisor  │
│ • Custom    │
└─────────────┘
```

### Service Discovery Mechanisms

#### 1. Docker Swarm Service Discovery

```yaml
# Prometheus automatically discovers services via Docker API
dockerswarm_sd_configs:
  - host: unix:///var/run/docker.sock
    role: services                    # Discover all Swarm services
    
# Relabeling adds meaningful labels
relabel_configs:
  - source_labels: [__meta_dockerswarm_service_name]
    target_label: service_name        # Service name becomes metric label
  - source_labels: [__meta_dockerswarm_service_label_com_docker_stack_namespace]
    target_label: stack_name          # Stack name becomes metric label
```

#### 2. Static Configuration

```yaml
# For services with known, stable endpoints
static_configs:
  - targets: ['node-exporter-manager:9100']
    labels:
      node_type: manager
      
```

#### 3. DNS-Based Discovery

Services communicate using Docker's built-in DNS:

```
prometheus:9090          # Prometheus server
grafana:3000            # Grafana dashboard
alertmanager:9093       # Alertmanager
node-exporter-*:9100    # Node Exporter instances
cadvisor-*:8080         # cAdvisor instances
```

### Load Balancing

**Internal Load Balancing**:
- Docker Swarm's built-in load balancer distributes requests
- Round-robin algorithm across healthy replicas
- Automatic health checking removes failed instances

**External Load Balancing**:
- Traefik handles external traffic distribution
- SSL termination and HTTP/2 support
- Automatic service registration via Docker labels

---

## Data Persistence

### Volume Management

```yaml
volumes:
  # Prometheus Data Storage
  prometheus-data:
    driver: local                     # Local storage driver
    # Stores: time-series database, WAL files, configuration
    
  prometheus-config:
    driver: local
    # Stores: prometheus.yml, alert rules, console templates
    
  # Grafana Data Storage
  grafana-data:
    driver: local
    # Stores: dashboards, users, organizations, data sources
    
  grafana-provisioning:
    driver: local
    # Stores: automated configuration files
    
  grafana-dashboards:
    driver: local
    # Stores: dashboard JSON definitions
    
  # Alertmanager Configuration
  alertmanager-config:
    driver: local
    # Stores: alertmanager.yml, templates, silences
    
  # Vault Integration
  vault-monitoring-secrets:
    driver: local
    # Stores: credentials, certificates, configuration templates
    
  vault-monitoring-agent-data:
    driver: local
    # Stores: Vault Agent state, tokens, cache
```

### Data Retention Policies

#### Prometheus Retention

```bash
# Configured in Prometheus startup parameters
--storage.tsdb.retention.time=30d    # Keep data for 30 days
--storage.tsdb.retention.size=10GB   # Maximum storage size
```

**Retention Strategy**:
- **Time-based**: Automatically delete data older than 30 days
- **Size-based**: Remove oldest data when storage exceeds 10GB
- **Compaction**: Automatic compression of old data for efficiency

#### Grafana Data Persistence

```bash
# Dashboard and configuration persistence
/var/lib/grafana/grafana.db         # SQLite database with dashboards
/var/lib/grafana/plugins/           # Installed plugins
/etc/grafana/provisioning/          # Automated configuration
```

#### Log Rotation

```bash
# Docker log rotation (configured in daemon.json)
"log-driver": "json-file"
"log-opts": {
  "max-size": "10m"                 # Maximum log file size
  "max-file": "3"                   # Number of log files to keep
}
```

### Backup Strategies

#### Automated Backups

```bash
# Prometheus data backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec prometheus-container promtool tsdb snapshot /prometheus
tar -czf prometheus-backup-${DATE}.tar.gz /var/lib/docker/volumes/prometheus-data/

# Grafana backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf grafana-backup-${DATE}.tar.gz /var/lib/docker/volumes/grafana-data/
```

#### Recovery Procedures

```bash
# Restore Prometheus data
docker service scale monitoring_prometheus=0
tar -xzf prometheus-backup-20241220_120000.tar.gz -C /var/lib/docker/volumes/prometheus-data/
docker service scale monitoring_prometheus=1

# Restore Grafana data
docker service scale monitoring_grafana=0
tar -xzf grafana-backup-20241220_120000.tar.gz -C /var/lib/docker/volumes/grafana-data/
docker service scale monitoring_grafana=1
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Prometheus Not Scraping Targets

**Symptoms**:
- Targets show as "DOWN" in Prometheus UI
- Missing metrics in Grafana dashboards

**Diagnosis**:
```bash
# Check Prometheus configuration
docker service logs monitoring_prometheus

# Verify network connectivity
docker exec -it prometheus-container wget http://node-exporter:9100/metrics

# Check service discovery
curl http://localhost:9090/api/v1/targets
```

**Solutions**:
- Verify network connectivity between services
- Check firewall rules and port accessibility
- Validate Prometheus configuration syntax
- Ensure exporters are running and healthy

#### 2. Grafana Dashboards Not Loading

**Symptoms**:
- Empty or broken dashboards
- "No data" messages in panels

**Diagnosis**:
```bash
# Check Grafana logs
docker service logs monitoring_grafana

# Verify data source connectivity
curl http://localhost:3000/api/datasources/proxy/1/api/v1/query?query=up

# Test Prometheus connection manually
curl http://prometheus:9090/api/v1/query?query=up
```

**Solutions**:
- Verify Prometheus data source configuration
- Check query syntax in dashboard panels
- Ensure time range covers data availability
- Validate network connectivity to Prometheus

#### 3. Alerts Not Firing

**Symptoms**:
- No alert notifications in Discord
- Alertmanager shows no active alerts

**Diagnosis**:
```bash
# Check Prometheus rule evaluation
curl http://localhost:9090/api/v1/rules

# Verify Alertmanager configuration
curl http://localhost:9093/api/v1/status

# Test Discord webhook manually
curl -X POST -H "Content-Type: application/json" \
  -d '{"content": "Test message"}' \
  https://discord.com/api/webhooks/...
```

**Solutions**:
- Validate alert rule syntax and thresholds
- Check Alertmanager routing configuration
- Verify Discord webhook URL and permissions
- Ensure network connectivity to Discord API

#### 4. High Memory Usage

**Symptoms**:
- Services getting OOM killed
- Slow dashboard loading

**Diagnosis**:
```bash
# Check container memory usage
docker stats

# Monitor Prometheus memory usage
curl http://localhost:9090/api/v1/query?query=prometheus_tsdb_head_samples

# Check for memory leaks
docker exec prometheus-container top
```

**Solutions**:
- Increase memory limits in Docker Compose
- Reduce Prometheus retention time/size
- Optimize query performance in dashboards
- Implement data source caching

#### 5. Vault Secret Access Issues

**Symptoms**:
- Services failing to start due to missing secrets
- Authentication errors

**Diagnosis**:
```bash
# Check Vault Agent logs
docker service logs monitoring_vault-agent-monitoring

# Verify secret availability
docker exec vault-agent-container ls -la /vault/secrets/

# Check Vault authentication
docker exec vault-agent-container vault auth -method=approle
```

**Solutions**:
- Verify AppRole credentials are valid
- Check Vault policies allow secret access
- Ensure Vault Agent configuration is correct
- Validate network connectivity to Vault server

### Performance Optimization

#### Prometheus Performance Tuning

```yaml
# Optimized Prometheus configuration
global:
  scrape_interval: 30s              # Reduce scraping frequency for less critical metrics
  evaluation_interval: 30s          # Reduce rule evaluation frequency

# Reduce retention for high-cardinality metrics
--storage.tsdb.retention.time=15d   # Shorter retention period
--storage.tsdb.retention.size=5GB   # Smaller storage limit

# Optimize memory usage
--query.max-concurrency=4           # Limit concurrent queries
--query.max-samples=50000000        # Limit query sample size
```

#### Grafana Performance Tuning

```bash
# Grafana configuration optimizations
GF_EXPLORE_ENABLED=false            # Disable Explore feature if not needed
GF_ANALYTICS_REPORTING_ENABLED=false # Disable analytics
GF_USERS_ALLOW_SIGN_UP=false       # Reduce user management overhead

# Database performance
GF_DATABASE_MAX_OPEN_CONN=25       # Limit database connections
GF_DATABASE_MAX_IDLE_CONN=25       # Limit idle connections
```

---

## Best Practices

### 1. Monitoring Strategy

**Layered Monitoring Approach**:
-  **Infrastructure Layer**: Node Exporter for system metrics
-  **Container Layer**: cAdvisor for container resource usage
-  **Application Layer**: Custom metrics from application code
-  **Service Layer**: Health checks and API response times
-  **Business Layer**: User activity and business KPIs

**Key Metrics to Monitor**:
- **SLIs (Service Level Indicators)**: Request rate, error rate, duration
- **Resource Utilization**: CPU, memory, disk, network usage
- **Availability**: Service uptime and health status
- **Business Metrics**: User registrations, active sessions, feature usage

### 2. Alert Design Principles

**Effective Alerting**:
- **Actionable**: Every alert should require human intervention
- **Relevant**: Alert on symptoms, not causes
- **Timely**: Alert before users are affected
- **Non-noisy**: Avoid alert fatigue with proper thresholds

**Alert Severity Levels**:
- **Critical**: Immediate action required (service down, data loss)
- **Warning**: Investigation needed (high resource usage, error rate)
- **Info**: Awareness only (deployments, maintenance windows)

### 3. Dashboard Design

**Dashboard Best Practices**:
-  **Purpose-Driven**: Each dashboard has specific audience and goal
-  **Logical Grouping**: Related metrics grouped together
-  **Consistent Time Ranges**: Synchronized time selection across panels
-  **Color Coding**: Consistent color scheme for similar metrics
-  **Performance**: Optimized queries for fast loading

**Dashboard Types**:
- **Executive Dashboards**: High-level business metrics and SLAs
- **Operational Dashboards**: Real-time system health and performance
- **Troubleshooting Dashboards**: Detailed metrics for problem diagnosis
- **Capacity Planning**: Resource trends and growth projections

### 4. Security Considerations

**Security Best Practices**:
-  **Authentication**: Strong authentication for all monitoring interfaces
-  **Authorization**: Role-based access to sensitive metrics
-  **Network Security**: Network segmentation and encryption
-  **Secret Management**: Secure handling of credentials and API keys
-  **Audit Logging**: Track access to monitoring systems

### 5. Maintenance and Operations

**Regular Maintenance Tasks**:
-  **Data Cleanup**: Regular cleanup of old metrics and logs
-  **Configuration Review**: Periodic review of alert rules and thresholds
-  **Performance Monitoring**: Monitor monitoring system performance
-  **Security Updates**: Keep all components updated with security patches
-  **Backup Verification**: Regular testing of backup and recovery procedures

**Operational Procedures**:
-  **Incident Response**: Clear procedures for handling alerts
-  **Change Management**: Process for updating monitoring configuration
-  **Capacity Planning**: Proactive scaling of monitoring infrastructure
-  **Documentation**: Keep monitoring documentation current

---

## Conclusion

This monitoring stack provides comprehensive observability for the FT Transcendence application, covering:

- **Complete Visibility**: System, container, and application metrics
- **Proactive Alerting**: Early warning system for potential issues
- **Secure Architecture**: Vault integration for credential management
- **Scalable Design**: Can grow with application requirements
- **Production Ready**: Proven components with enterprise features

### Key Benefits

1. **Early Problem Detection**: Issues identified before user impact
2. **Root Cause Analysis**: Detailed metrics help isolate problems quickly
3. **Capacity Planning**: Historical data supports growth planning
4. **Performance Optimization**: Metrics guide optimization efforts
5. **Compliance**: Audit trails and security monitoring support compliance

### Next Steps

1. **Custom Metrics**: Implement application-specific metrics
2. **SLA Monitoring**: Define and monitor service level agreements
3. **Automated Remediation**: Implement auto-scaling and self-healing
4. **Advanced Analytics**: Add machine learning for anomaly detection
5. **Integration**: Connect with CI/CD pipeline for deployment metrics

---
