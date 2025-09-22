# Traefik Configuration Documentation

## Table of Contents
1. [Why Traefik Over Nginx](#why-traefik-over-nginx)
2. [Traefik Core Configuration](#traefik-core-configuration)
3. [Complete Label Reference](#complete-label-reference)
4. [Stack-by-Stack Configuration](#stack-by-stack-configuration)
5. [Security Implementation](#security-implementation)
6. [Best Practices](#best-practices)

---

## Why Traefik Over Nginx?

### **Dynamic Service Discovery**
Unlike Nginx which requires manual configuration file editing and reloading, Traefik automatically discovers services through:
- **Docker Swarm Mode**: Monitors Docker API for new services
- **Label-Based Configuration**: Services configure themselves via Docker labels
- **Zero-Downtime Updates**: No manual restarts when adding/removing services

### **Built-in HTTPS & SSL Management**
```yaml
# Traefik: One line for automatic HTTPS
- "traefik.http.routers.app.tls=true"

# Nginx: Multiple config blocks, manual certificate management
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    # ... many more lines
}
```

### **Microservices-First Design**
- **Container-Native**: Designed specifically for containerized environments
- **Load Balancing**: Built-in load balancing with health checks
- **Middleware Chain**: Composable middleware for authentication, rate limiting, etc.
- **Multi-Protocol Support**: HTTP, HTTPS, TCP, UDP routing

### **Operational Simplicity**
- **No Configuration Files**: Everything via labels or API
- **Visual Dashboard**: Built-in web UI for monitoring
- **Metrics Integration**: Native Prometheus metrics
- **Cloud-Native**: Works seamlessly with Docker Swarm, Kubernetes, Consul

---

## ️ Traefik Core Configuration

### **Static Configuration (`traefik.yml`)**

```yaml
# Entry Points - Traffic Reception
entryPoints:
  web:
    address: ":80"      # HTTP traffic (redirects to HTTPS)
  websecure:
    address: ":443"     # HTTPS traffic (main entry point)

# Service Discovery
providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"  # Connect to Docker daemon
    swarmMode: true                          # Enable Docker Swarm support
    exposedByDefault: false                  # Require explicit enable labels
    network: traefik-public                  # Default network for services
    watch: true                              # Watch for service changes

# Security Configuration
tls:
  options:
    default:
      minVersion: "VersionTLS12"             # Minimum TLS 1.2
      cipherSuites:                          # Strong cipher suites only
        - "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"
        - "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305"
```

**Why This Configuration?**
- **Security First**: TLS 1.2+ with strong ciphers
- **Docker Swarm Integration**: Native service discovery
- **Explicit Opt-in**: Services must explicitly enable Traefik exposure
- **Network Isolation**: Dedicated `traefik-public` network

---

## Complete Label Reference

### **Essential Labels (Required for all services)**

#### **Service Discovery & Enablement**
```yaml
- "traefik.enable=true"                          # Enable Traefik for this service
- "traefik.constraint-label=traefik-public"      # Network constraint
- "traefik.docker.network=traefik-public"        # Explicit network specification
```

**Label-by-Label Explanation:**

**`traefik.enable=true`**
- **Purpose**: Tells Traefik to manage this service
- **Default**: `false` (services are ignored by default)
- **Why needed**: Security - prevents accidental exposure of internal services
- **Effect**: Traefik starts monitoring this container for routing configuration

**`traefik.constraint-label=traefik-public`**
- **Purpose**: Applies a constraint filter to this service
- **How it works**: Only Traefik instances with matching constraint will handle this service
- **Use case**: In multi-Traefik setups, separates internal vs external traffic
- **Security benefit**: Prevents internal services from being exposed by wrong Traefik instance

**`traefik.docker.network=traefik-public`**
- **Purpose**: Specifies which Docker network Traefik should use to communicate with this service
- **Why explicit**: Services might be on multiple networks
- **Security**: Ensures traffic flows through the designated secure network
- **Alternative**: Without this, Traefik auto-detects which can be unreliable

#### **Basic Routing**
```yaml
- "traefik.http.routers.{service}.rule=Host(`domain.com`)"           # Domain routing
- "traefik.http.routers.{service}.entrypoints=websecure"             # HTTPS entry point
- "traefik.http.routers.{service}.tls=true"                          # Enable TLS
- "traefik.http.services.{service}.loadbalancer.server.port=8080"    # Backend port
```

**Label-by-Label Explanation:**

**`traefik.http.routers.{service}.rule=Host(\`domain.com\`)`**
- **Purpose**: Defines when this router should handle a request
- **Syntax**: `Host(\`domain.com\`)` = match requests to this exact domain
- **Other options**: `PathPrefix(\`/api\`)`, `Headers(\`X-API-Key\`, \`secret\`)`, etc.
- **Multiple rules**: Can combine with `&&` or `||` operators
- **Example**: `Host(\`api.example.com\`) && PathPrefix(\`/v1\`)`

**`traefik.http.routers.{service}.entrypoints=websecure`**
- **Purpose**: Specifies which entry point (port) should handle this route
- **websecure**: Port 443 (HTTPS) as defined in traefik.yml
- **web**: Port 80 (HTTP) - typically used for redirects only
- **Why important**: Without this, router won't know which port to listen on
- **Multiple entrypoints**: `web,websecure` (handles both HTTP and HTTPS)

**`traefik.http.routers.{service}.tls=true`**
- **Purpose**: Enables TLS/SSL termination for this route
- **Effect**: Traefik handles SSL decryption before forwarding to backend
- **Certificate source**: Uses default certificate or auto-generates
- **Performance**: SSL handled by Traefik, backend gets plain HTTP
- **Security**: Ensures encrypted communication with clients

**`traefik.http.services.{service}.loadbalancer.server.port=8080`**
- **Purpose**: Tells Traefik which port the backend service is listening on
- **Why needed**: Container might expose multiple ports
- **Load balancing**: If multiple containers, Traefik distributes across all
- **Health checks**: Traefik can monitor this port for service health
- **Format**: Must be the internal container port, not Docker host port

#### **HTTP to HTTPS Redirection**
```yaml
- "traefik.http.routers.{service}-http.rule=Host(`domain.com`)"          # HTTP router
- "traefik.http.routers.{service}-http.entrypoints=web"                  # HTTP entry point
- "traefik.http.routers.{service}-http.middlewares=redirect-to-https"    # Redirect middleware
- "traefik.http.routers.{service}-http.tls=false"                        # No TLS for HTTP
```

**Label-by-Label Explanation:**

**`traefik.http.routers.{service}-http.rule=Host(\`domain.com\`)`**
- **Purpose**: Creates a separate router specifically for HTTP requests
- **Naming convention**: `{service}-http` distinguishes from HTTPS router
- **Same rule**: Must match the HTTPS router's rule for consistency
- **Priority**: Lower priority than HTTPS router (Traefik handles automatically)

**`traefik.http.routers.{service}-http.entrypoints=web`**
- **Purpose**: HTTP router listens on port 80 only
- **web**: Entry point defined as `:80` in traefik.yml
- **Separation**: Keeps HTTP and HTTPS routing logic separate
- **Redirect flow**: HTTP request → web entrypoint → redirect middleware → HTTPS

**`traefik.http.routers.{service}-http.middlewares=redirect-to-https`**
- **Purpose**: Applies redirect middleware to transform HTTP requests to HTTPS
- **Middleware reference**: Points to middleware defined elsewhere
- **Processing order**: Applied before reaching backend service
- **Chain support**: Can chain multiple middlewares with commas

**`traefik.http.routers.{service}-http.tls=false`**
- **Purpose**: Explicitly disables TLS for HTTP router
- **Why explicit**: Prevents confusion about SSL handling
- **Best practice**: HTTP routers should never handle TLS
- **Clear intent**: Documents that this router is for redirection only

#### **Redirect Middleware Definition**
```yaml
- "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"     # Target scheme
- "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"   # 301 redirect
```

**Label-by-Label Explanation:**

**`traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https`**
- **Purpose**: Defines a middleware that changes the URL scheme
- **Middleware name**: `redirect-to-https` (can be referenced by any router)
- **redirectscheme**: Type of middleware (changes URL scheme)
- **scheme=https**: Target scheme to redirect to
- **Effect**: `http://example.com/path` → `https://example.com/path`

**`traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true`**
- **Purpose**: Specifies the type of HTTP redirect
- **permanent=true**: Issues HTTP 301 (Moved Permanently)
- **SEO benefit**: Search engines transfer page rank to HTTPS URL
- **Browser caching**: Browsers cache 301 redirects for better performance
- **Alternative**: `permanent=false` would use HTTP 302 (temporary redirect)

### **Security Middleware Labels**

#### **Security Headers**
```yaml
- "traefik.http.middlewares.security-headers.headers.frameDeny=true"                              # Prevent clickjacking
- "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"                     # Prevent MIME sniffing
- "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"                       # XSS protection
- "traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin"  # Referrer policy
- "traefik.http.middlewares.security-headers.headers.customRequestHeaders.X-Forwarded-Proto=https"     # Protocol header
```

**Label-by-Label Explanation:**

**`traefik.http.middlewares.security-headers.headers.frameDeny=true`**
- **Purpose**: Adds `X-Frame-Options: DENY` header to all responses
- **Security**: Prevents the page from being embedded in frames/iframes
- **Attack prevention**: Stops clickjacking attacks
- **Browser support**: Supported by all modern browsers
- **Alternative**: Could use `sameOrigin` to allow same-domain framing

**`traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true`**
- **Purpose**: Adds `X-Content-Type-Options: nosniff` header
- **Security**: Prevents browsers from MIME-type sniffing
- **Attack prevention**: Stops content-type confusion attacks
- **Behavior**: Forces browsers to respect the declared Content-Type
- **Example**: Prevents treating text/plain as text/html

**`traefik.http.middlewares.security-headers.headers.browserXssFilter=true`**
- **Purpose**: Adds `X-XSS-Protection: 1; mode=block` header
- **Security**: Enables browser's built-in XSS protection
- **Behavior**: Browser blocks detected XSS attempts
- **Modern note**: Newer browsers rely on CSP instead
- **Compatibility**: Provides defense for older browsers

**`traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin`**
- **Purpose**: Controls how much referrer information is sent with requests
- **Policy breakdown**:
  - Same origin: Send full URL as referrer
  - Cross origin HTTPS→HTTPS: Send origin only
  - Cross origin HTTPS→HTTP: Send nothing
- **Privacy**: Reduces information leakage to third parties
- **Analytics**: Balances analytics needs with privacy

**`traefik.http.middlewares.security-headers.headers.customRequestHeaders.X-Forwarded-Proto=https`**
- **Purpose**: Adds custom header to requests sent to backend
- **Header**: `X-Forwarded-Proto: https`
- **Backend awareness**: Tells backend service the original protocol was HTTPS
- **Use case**: Backend can adjust behavior based on original protocol
- **Example**: Backend can generate proper HTTPS URLs in responses

#### **Authentication Middleware**
```yaml
- "traefik.http.routers.{service}.middlewares=auth@file,security-headers"     # Apply auth + security
- "traefik.http.middlewares.basic-auth.basicauth.users=admin:$$hashed$$"      # Basic auth users
```

**Label-by-Label Explanation:**

**`traefik.http.routers.{service}.middlewares=auth@file,security-headers`**
- **Purpose**: Applies multiple middlewares to this router in order
- **Processing order**: `auth@file` executes first, then `security-headers`
- **auth@file**: References authentication middleware defined in file provider
- **Comma separation**: Each middleware separated by comma
- **Chain execution**: Request passes through each middleware in sequence

**`traefik.http.middlewares.basic-auth.basicauth.users=admin:$$hashed$$`**
- **Purpose**: Defines Basic HTTP Authentication middleware
- **Middleware name**: `basic-auth` (can be referenced by routers)
- **basicauth**: Type of authentication middleware
- **users**: Username:password pairs (password must be hashed)
- **$$hashed$$**: Password hashed with Apache htpasswd format
- **Security**: Never store plain text passwords in labels

### **Advanced Configuration Labels**

#### **Service-Specific Labels**
```yaml
- "traefik.http.routers.dashboard.service=api@internal"                  # Internal Traefik API
- "traefik.http.routers.{service}.priority=100"                          # Router priority
```

**Label-by-Label Explanation:**

**`traefik.http.routers.dashboard.service=api@internal`**
- **Purpose**: Routes to Traefik's internal API service instead of container
- **api@internal**: Special Traefik service for dashboard/API access
- **Use case**: Accessing Traefik's own dashboard
- **Security**: Can be protected with authentication middleware
- **Alternative**: Could route to external monitoring service

**`traefik.http.routers.{service}.priority=100`**
- **Purpose**: Sets router priority for rule matching
- **Default**: Routers with same rule compete, highest priority wins
- **Use case**: When multiple routers could match same request
- **Number**: Higher numbers = higher priority
- **Example**: Priority 100 beats priority 50

#### **Middleware Reference Labels**
```yaml
- "traefik.http.routers.vault.middlewares=vault-auth@file,security-headers@file"
- "traefik.http.routers.prometheus.middlewares=prometheus-auth@file,security-headers@file"
```

**Label-by-Label Explanation:**

**`@file` Reference Syntax:**
- **Purpose**: References middleware defined in file provider (not labels)
- **vault-auth@file**: Middleware named `vault-auth` from file configuration
- **security-headers@file**: Middleware named `security-headers` from file config
- **Advantage**: Centralized middleware definitions, reusable across services
- **Security**: Sensitive config (like auth) stored in files, not exposed labels

**Middleware Chaining:**
- **Order matters**: Middlewares execute left to right
- **Auth first**: Authentication before other processing
- **Headers last**: Security headers added after processing
- **Error handling**: Failed middleware stops chain execution

---

## Stack-by-Stack Configuration

### **1. Main Application Stack** (`docker-compose.app.yml`)

**Service**: Main Web Application  
**Domain**: `ft-transcendence.com`  
**Purpose**: Primary application frontend

```yaml
labels:
  # Core Configuration
  - "traefik.enable=true"
  - "traefik.http.routers.app.rule=Host(`ft-transcendence.com`)"
  - "traefik.http.routers.app.entrypoints=websecure"
  - "traefik.http.routers.app.tls=true"
  - "traefik.http.services.app.loadbalancer.server.port=80"
  
  # Security Middleware
  - "traefik.http.routers.app.middlewares=security-headers"
  - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
  - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
  - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
  - "traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin"
  - "traefik.http.middlewares.security-headers.headers.customRequestHeaders.X-Forwarded-Proto=https"
  
  # HTTP to HTTPS Redirection
  - "traefik.http.routers.app-http.rule=Host(`ft-transcendence.com`)"
  - "traefik.http.routers.app-http.entrypoints=web"
  - "traefik.http.routers.app-http.middlewares=redirect-to-https"
  - "traefik.http.routers.app-http.tls=false"
  - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
  - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
```

**Detailed Line-by-Line Analysis:**

**Core Configuration Lines:**
1. `"traefik.enable=true"` - **Activates Traefik management** for this container
2. `"traefik.http.routers.app.rule=Host(\`ft-transcendence.com\`)"` - **Main domain routing** - Routes all requests to `ft-transcendence.com` to this service
3. `"traefik.http.routers.app.entrypoints=websecure"` - **HTTPS-only access** - Only accepts traffic on port 443 (HTTPS)
4. `"traefik.http.routers.app.tls=true"` - **SSL termination** - Traefik handles SSL decryption
5. `"traefik.http.services.app.loadbalancer.server.port=80"` - **Backend port** - Container serves on port 80 internally

**Security Middleware Lines:**
6. `"traefik.http.routers.app.middlewares=security-headers"` - **Apply security middleware** - Routes through security header middleware
7. `"traefik.http.middlewares.security-headers.headers.frameDeny=true"` - **Anti-clickjacking** - Adds `X-Frame-Options: DENY`
8. `"traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"` - **MIME protection** - Adds `X-Content-Type-Options: nosniff`
9. `"traefik.http.middlewares.security-headers.headers.browserXssFilter=true"` - **XSS protection** - Adds `X-XSS-Protection: 1; mode=block`
10. `"traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin"` - **Referrer control** - Limits referrer information
11. `"traefik.http.middlewares.security-headers.headers.customRequestHeaders.X-Forwarded-Proto=https"` - **Protocol awareness** - Backend knows original protocol

**HTTP Redirection Lines:**
12. `"traefik.http.routers.app-http.rule=Host(\`ft-transcendence.com\`)"` - **HTTP router** - Separate router for HTTP requests
13. `"traefik.http.routers.app-http.entrypoints=web"` - **HTTP port** - Listens on port 80 for HTTP
14. `"traefik.http.routers.app-http.middlewares=redirect-to-https"` - **Apply redirect** - Uses redirect middleware
15. `"traefik.http.routers.app-http.tls=false"` - **No SSL on HTTP** - HTTP router doesn't handle SSL
16. `"traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"` - **Target HTTPS** - Redirects to HTTPS scheme
17. `"traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"` - **301 redirect** - Permanent redirect for SEO

**Why This Configuration?**
- **Primary Domain**: Main application gets the clean domain
- **Comprehensive Security**: Full security header implementation
- **Automatic HTTPS**: All HTTP traffic redirected to HTTPS
- **Performance**: Direct routing without unnecessary middleware

### **2. Monitoring Stack** (`docker-compose.monitoring.yml`)

#### **Prometheus** (`prometheus.ft-transcendence.com`)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.constraint-label=traefik-public"
  - "traefik.http.routers.prometheus.rule=Host(`prometheus.ft-transcendence.com`)"
  - "traefik.http.routers.prometheus.entrypoints=websecure"
  - "traefik.http.routers.prometheus.tls=true"
  - "traefik.http.services.prometheus.loadbalancer.server.port=9090"
  - "traefik.http.routers.prometheus.middlewares=prometheus-auth@file,security-headers@file"
```

#### **Grafana** (`monitoring.ft-transcendence.com`)
```yaml
labels:
  - "traefik.http.routers.grafana.rule=Host(`monitoring.ft-transcendence.com`)"
  - "traefik.http.routers.grafana.entrypoints=websecure"
  - "traefik.http.routers.grafana.middlewares=security-headers@file"
```

#### **AlertManager** (`alertmanager.ft-transcendence.com`)
```yaml
labels:
  - "traefik.http.routers.alertmanager.rule=Host(`alertmanager.ft-transcendence.com`)"
  - "traefik.http.routers.alertmanager.middlewares=alertmanager-auth@file,security-headers@file"
```

**Why Separate Subdomains?**
- **Service Isolation**: Each monitoring tool has its own subdomain
- **Authentication Control**: Different auth requirements per service
- **SSL Termination**: Traefik handles SSL for all monitoring tools
- **Load Balancing**: Automatic load balancing if services scale

### **3. Logging Stack** (`docker-compose.logging.yml`)

#### **Kibana** (`logging.ft-transcendence.com`)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.kibana.rule=Host(`logging.ft-transcendence.com`)"
  - "traefik.http.routers.kibana.entrypoints=websecure"
  - "traefik.http.routers.kibana.tls=true"
  - "traefik.http.services.kibana.loadbalancer.server.port=5601"
  - "traefik.http.routers.kibana.middlewares=security-headers"
```

**Migration from TCP to HTTP Routing**:
Originally used TCP routing with TLS passthrough, migrated to HTTP routing for:
- **Better Control**: Middleware support (auth, headers, rate limiting)
- **SSL Termination**: Traefik handles SSL instead of Kibana
- **Monitoring**: Better request/response metrics
- **Consistency**: Same pattern as other services

### **4. Vault Stack** (`docker-compose.vault.yml`)

#### **Vault UI** (`vault.ft-transcendence.com`)
```yaml
labels:
  - "traefik.http.routers.vault.rule=Host(`vault.ft-transcendence.com`)"
  - "traefik.http.routers.vault.entrypoints=websecure"
  - "traefik.http.routers.vault.middlewares=vault-auth@file,security-headers@file"
  - "traefik.http.services.vault.loadbalancer.server.port=8200"
```

**Security Focus**:
- **File-based Auth**: Authentication defined in static files
- **Network Isolation**: Vault isolated to specific networks
- **Port Specification**: Explicit port 8200 for Vault API

### **5. Registry Stack** (`docker-compose.registry.yml`)

#### **Registry UI** (`registry-ui.ft-transcendence.com`)
```yaml
labels:
  - "traefik.http.routers.registry-ui.rule=Host(`registry-ui.ft-transcendence.com`)"
  - "traefik.http.routers.registry-ui.middlewares=registry-ui-auth@file,security-headers@file"
  - "traefik.http.services.registry-ui.loadbalancer.server.port=80"
```

**Private Registry Access**:
- **Authenticated Access**: Required for Docker registry management
- **Web UI**: User-friendly interface for registry operations
- **Security Headers**: Standard security middleware applied

### **6. Traefik Stack** (`docker-compose.traefik.yml`)

#### **Traefik Dashboard** (`traefik.ft-transcendence.com`)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.dashboard.rule=Host(`traefik.ft-transcendence.com`)"
  - "traefik.http.routers.dashboard.entrypoints=websecure"
  - "traefik.http.routers.dashboard.tls=true"
  - "traefik.http.routers.dashboard.service=api@internal"
  - "traefik.http.routers.dashboard.middlewares=basic-auth,security-headers"
  - "traefik.http.middlewares.basic-auth.basicauth.users=admin:$$apr1$$N3PmTwe1$$hAPdsIjfYRQsasKA6QtUx0"
```

**Self-Management**:
- **Internal Service**: `api@internal` for Traefik's built-in dashboard
- **Basic Authentication**: Simple username/password protection
- **Self-Routing**: Traefik routes to its own dashboard

---

## Security Implementation

### **Multi-Layer Security Strategy**

#### **1. Network Level Security**
```yaml
networks:
  traefik-public:
    external: true    # Isolated network for public-facing services
```

#### **2. Authentication Middleware**
```yaml
# File-based authentication (stored in dynamic config)
"@file" references:
- vault-auth@file
- prometheus-auth@file
- registry-ui-auth@file
```

#### **3. Security Headers**
All services implement comprehensive security headers:
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing
- **X-XSS-Protection**: Browser XSS filtering
- **Referrer-Policy**: Control referrer information
- **X-Forwarded-Proto**: Ensure HTTPS awareness

#### **4. TLS Configuration**
- **Minimum TLS 1.2**: Modern security standards
- **Strong Ciphers**: ECDHE and AES-GCM preferred
- **Perfect Forward Secrecy**: ECDHE key exchange

---

## Best Practices Implemented

### **1. Consistent Naming Convention**
```yaml
# Router names: {service}-{protocol}
app, app-http
kibana, kibana-http
vault, vault-http
```

### **2. Middleware Composition**
```yaml
# Chainable middleware for flexibility
middlewares=auth@file,security-headers@file
middlewares=redirect-to-https
middlewares=security-headers
```

### **3. Explicit Configuration**
```yaml
# Always specify entry points explicitly
entrypoints=websecure  # For HTTPS
entrypoints=web        # For HTTP (redirect only)
```

### **4. Network Isolation**
```yaml
# Dedicated network for public services
traefik.docker.network=traefik-public
```

### **5. Port Specification**
```yaml
# Explicit port mapping for clarity
traefik.http.services.{service}.loadbalancer.server.port=8080
```

---

## Advantages of This Traefik Setup

### **1. Operational Benefits**
- **Zero-Downtime Deployments**: Services update without Traefik restart
- **Automatic Service Discovery**: New services auto-configured via labels
- **Centralized SSL Management**: Single point for certificate handling
- **Built-in Load Balancing**: Automatic load balancing with health checks

### **2. Security Benefits**
- **Consistent Security Headers**: Applied across all services
- **Centralized Authentication**: File-based auth management
- **Automatic HTTPS**: All services secured by default
- **Network Segmentation**: Isolated public network

### **3. Monitoring Benefits**
- **Built-in Metrics**: Prometheus-compatible metrics
- **Request Tracing**: Detailed request/response logging
- **Health Checks**: Automatic service health monitoring
- **Dashboard Visibility**: Real-time traffic visualization

### **4. Scalability Benefits**
- **Horizontal Scaling**: Automatic load balancing for scaled services
- **Multi-Node Support**: Works across Docker Swarm cluster
- **Service Mesh Ready**: Foundation for advanced networking
- **Cloud Portability**: Easily portable to Kubernetes/cloud platforms

---

##  Comparison: Traefik vs Nginx for This Use Case

| Aspect | Nginx Approach | Traefik Approach |
|--------|----------------|------------------|
| **Configuration** | Static files + manual reload | Dynamic labels + auto-discovery |
| **SSL Management** | Manual certificate handling | Automatic TLS termination |
| **Service Addition** | Edit config + reload | Deploy with labels |
| **Load Balancing** | Manual upstream definition | Automatic service discovery |
| **Monitoring** | External solutions needed | Built-in metrics + dashboard |
| **Docker Integration** | Manual container mapping | Native Docker Swarm support |
| **Zero Downtime** | Requires careful reload | Automatic updates |
| **Authentication** | Location-based config | Composable middleware |

**Result**: Traefik provides a more maintainable, scalable, and operationally simple solution for containerized microservices architecture.

---

This configuration demonstrates a production-ready Traefik setup that prioritizes security, scalability, and operational simplicity while providing comprehensive traffic management for a distributed application architecture.