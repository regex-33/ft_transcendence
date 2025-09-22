## Introduction

This documentation will guide you through setting up a complete secrets management system using HashiCorp Vault integrated with Docker Swarm. By the end of this guide, you'll understand how to securely manage passwords, API keys, and other sensitive data in a containerized environment.

**What you'll achieve:**
- Secure storage of all sensitive data (passwords, API keys, certificates)
- Automatic secret rotation and management
- Centralized authentication and authorization
- Integration with your existing Docker Swarm applications

---

## What is HashiCorp Vault?

![Vault Architecture](https://developer.hashicorp.com/img/vault-reference-architecture-3cf78d2b.png)

HashiCorp Vault is like a **digital safe** for your applications. Instead of storing passwords and secrets directly in your code or configuration files, Vault:

### Core Concepts:

**1. Secrets Storage**
- Think of it as a secure database for sensitive information
- Passwords, API keys, certificates are stored encrypted
- Access is strictly controlled and logged

**2. Authentication Methods**
- **AppRole**: For applications (like your microservices)
- **UserPass**: For human users
- Each method has different security levels

**3. Policies**
- Rules that define who can access what secrets
- Like permissions on a file system, but for secrets

**4. Secret Engines**
- Different ways to generate and store secrets
- **KV (Key-Value)**: Simple secret storage
- **Database**: Dynamic database credentials
- **PKI**: Certificate generation

### Understanding AppRole Authentication Method

**What AppRole is:**
- **AppRole** = "Application Role"
- It's designed for **machines, services, or automated scripts** (not humans)
- Instead of logging in with username/password or GitHub/OIDC, an app gets credentials in the form of:
  - **RoleID** (like a username — usually safe to distribute)
  - **SecretID** (like a password — should be kept secret)

Together, the RoleID + SecretID let the app authenticate to Vault and receive a **Vault token**.

**How AppRole Works (Complete Flow):**

**Step 1: Admin enables AppRole**
```bash
vault auth enable approle
```

**Step 2: Admin creates a role**
```bash
vault write auth/approle/role/myapp \
    secret_id_ttl=60m \
    token_ttl=30m \
    token_max_ttl=120m \
    policies="app-policy"
```
- `myapp` is the role name
- It's tied to certain **policies** (what the app can do)

**Step 3: App gets credentials**
- RoleID is fetched with:
```bash
vault read auth/approle/role/myapp/role-id
```
- SecretID is generated with:
```bash
vault write -f auth/approle/role/myapp/secret-id
```

**Step 4: App logs in**
```bash
curl --request POST \
  --data '{"role_id":"<ROLE_ID>","secret_id":"<SECRET_ID>"}' \
  https://vault.example.com/v1/auth/approle/login
```
- Vault responds with a **client token**
- That token is used in headers (`X-Vault-Token: <token>`) to access secrets

**Why AppRole is useful:**
- Best for **automated deployments**, CI/CD, and apps inside containers/VMs
- Removes the need to hardcode long-lived root tokens
- Supports **rotation** and **limited TTLs** for both SecretIDs and tokens
- You can control which client machines are allowed to request a SecretID (via `bind_secret_id` + constraints like IPs)

**In short: AppRole = a way for applications to securely authenticate to Vault and get a token, without using human credentials.**

### Understanding Vault Keys vs Tokens

There are **two different "keys"** in play here:

**1. Encryption Key (Internal)**
- This is what Vault itself uses to encrypt/decrypt data in the storage backend
- It lives only **in Vault's memory** after unseal
- You never see it or use it directly
- That's the one protected by the **unseal keys**

**2. Vault Token (`X-Vault-Token`)**
- This is a **client authentication credential**, not the storage encryption key
- It's like a session token or API key
- When you log in (with root token, AppRole, userpass, OIDC, etc.), Vault gives you a token
- Every API call you make includes this token in the HTTP header:
```
X-Vault-Token: <your-token>
```
- Vault checks this token against policies to decide if you're allowed to read/write secrets

**Think of it like this:**
- **Encryption key** = the actual lock/unlock mechanism on the safe
- **Vault token** = your badge/keycard that lets you ask the safe to open something for you

### Vault Sealed vs Unsealed States

**When Vault is Sealed:**
- You **cannot read secrets** → every `vault kv get`, `vault read`, etc. fails
- You **cannot write secrets** → `vault kv put`, `vault write`, etc. fails
- Auth methods, policies, leases — all inaccessible
- Why? Because the **encryption key** that protects all data in storage is not in memory

**What you CAN do when sealed:**
- Run `vault operator status` → shows if it's sealed/unsealed
- Run `vault operator init` → if it's never been initialized
- Run `vault operator unseal` → provide enough unseal keys to load the master key

**Once Vault is Unsealed:**
- You can read/write secrets
- You can enable/disable secret engines, auth methods, etc
- The encryption key is in memory and Vault can decrypt storage

**Think of it like a safe:**
- **Sealed = locked safe** → you can see the safe exists, but not what's inside
- **Unsealed = safe opened** → now you can store or retrieve documents

### Vault Initialization Process

**The Complete Sequence:**

**1. Vault is uninitialized** (fresh install, empty storage backend)
- No encryption keys exist yet
- Any command except `vault operator init` will fail, saying the Vault is not initialized

**2. Run `vault operator init`**
- Vault generates the **master key** and splits it into shards using **Shamir's Secret Sharing**
- It stores an **encryption key** in memory (wrapped by the master key) that will be used to encrypt/decrypt data in storage
- It outputs:
  - A set of **unseal keys** (default: 5, with a threshold of 3)
  - The **initial root token**

**3. After init, Vault is still sealed**
- Even though keys were generated, the **encryption key is not yet loaded into memory**
- Storage remains inaccessible

**4. Unseal process (`vault operator unseal`)**
- Operators must provide enough unseal keys (e.g., 3 of 5) to reconstruct the master key
- This master key decrypts the encryption key
- Once loaded into memory, Vault becomes **unsealed** and operational

**In short: After `vault operator init`, Vault is sealed until you perform the unseal process.**

**Example `vault operator status` Output:**

**Sealed State:**
```bash
$ vault operator status
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          true        # ← SEALED
Total Shares    5
Threshold       3
Unseal Progress 0/3         # ← Need 3 keys to unseal
Unseal Nonce    n/a
Version         1.20.2
Storage Type    file
HA Enabled      false
```

**Unsealed State:**
```bash
$ vault operator status
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false       # ← UNSEALED
Total Shares    5
Threshold       3
Version         1.20.2
Storage Type    file
Cluster Name    vault-cluster-abc123
Cluster ID      12345678-1234-1234-1234-123456789012
HA Enabled      false
```

### Binary Protocol Analysis

#### Vault's HTTP API Under the Hood

**Binary Packet Structure:**
When applications communicate with Vault, here's what happens at the binary level:

```bash
# TCP packet capture showing raw HTTP/JSON
$ tcpdump -i eth0 -A -s 0 'host vault and port 8200'

# Example AppRole login packet:
POST /v1/auth/approle/login HTTP/1.1
Host: vault:8200
Content-Type: application/json
Content-Length: 156

{"role_id":"role-12345678-1234-1234-1234-123456789012","secret_id":"secret-abcd1234-5678-90ef-ghij-klmnopqrstuv"}

# Response packet:
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 592

{"auth":{"client_token":"hvs.CAESIJ...","accessor":"hmac-sha256:...","policies":["app-policy","default"],"token_policies":["app-policy","default"],"metadata":{"role_name":"app"},"lease_duration":3600,"renewable":true}}
```

**Token Format Deep Dive:**
Vault tokens have a specific structure that encodes security information:

```bash
# Token format: hvs.CAESIJ<base64-encoded-data>
# Example: hvs.CAESIJ1234567890abcdefghijklmnopqrstuvwxyz

# Breakdown:
# hvs.     - Token version identifier (HashiCorp Vault Service)
# CAESIJ   - Token type identifier
# remainder - Base64 encoded token data containing:
#            - Random bytes (entropy)
#            - Creation timestamp
#            - Accessor hash
#            - Internal routing information
```

#### Storage Backend File Structure

**Vault's File System Layout:**
```bash
/vault/data/
├── core/
│   ├── master           # Encrypted master key (sealed with Shamir shares)
│   ├── keyring          # Key ring for cryptographic operations
│   └── seal-config      # Seal configuration
├── logical/
│   └── <mount-uuid>/    # Each secret engine gets UUID directory
│       └── <secret-path># Actual encrypted secret data
├── sys/
│   ├── policy/          # Access control policies
│   ├── mounts/          # Mounted secret engines
│   └── auth/            # Authentication method configs
└── auth/
    └── approle/         # AppRole authentication data
        ├── role/        # Role definitions
        └── secret-id/   # Secret-ID storage
```

**Secret Encryption Process:**
```bash
# When storing secret/app/database:
[INPUT]    {"host": "postgres", "password": "secret123"}
[ENCRYPT]  AES-256-GCM encryption with data encryption key
[STORE]    Binary encrypted blob at /vault/data/logical/<uuid>/app/database
[METADATA] Version, creation time, lease info stored separately
```

### Complete Authentication Flow Internals

#### Phase-by-Phase AppRole Authentication

**Phase 1: Role-ID Validation (Nanosecond Timing)**
```bash
T+0ns:     Receive HTTP POST /v1/auth/approle/login
T+1000ns:  Parse JSON payload, extract role_id
T+2000ns:  Hash role_id: SHA256(role-12345678...)
T+3000ns:  Storage lookup: auth/approle/role/<hash>
T+4000ns:  Role found, load configuration
T+5000ns:  Validate role is active, not deleted
```

**Phase 2: Secret-ID Validation**
```bash
T+6000ns:  Extract secret_id from payload
T+7000ns:  Hash secret_id: SHA256(secret-abcd1234...)
T+8000ns:  Storage lookup: auth/approle/secret-id/<hash>
T+9000ns:  Verify secret_id belongs to this role_id
T+10000ns: Check TTL: created_time + ttl > current_time
T+11000ns: Check usage count: uses_remaining > 0
T+12000ns: Decrement usage count if limited
```

**Phase 3: Policy Resolution**
```bash
T+13000ns: Load role policies: ["app-policy"]
T+14000ns: Merge with default policies: ["app-policy", "default"]
T+15000ns: Compile policy ACL tree in memory
T+16000ns: Generate token UUID: 32 random bytes
T+17000ns: Create token metadata structure
T+18000ns: Set token TTL based on role configuration
```

**Phase 4: Token Creation**
```bash
T+19000ns: Generate accessor: HMAC-SHA256(token, accessor_key)
T+20000ns: Store token in storage: auth/token/id/<token_hash>
T+21000ns: Store accessor mapping: auth/token/accessor/<accessor>
T+22000ns: Create audit log entry
T+23000ns: Format HTTP response JSON
T+24000ns: Send HTTP 200 with token data
```

---

## Deep Dive: Vault Unsealing Process

### The Cryptographic Foundation

Vault uses a sophisticated sealing mechanism based on Shamir's Secret Sharing algorithm. Here's how it works at the cryptographic level:

#### Shamir's Secret Sharing Explained

The secret is split into multiple shares, which individually do not give any information about the secret. To reconstruct a secret secured by SSS, a number of shares is needed, called the threshold.

**Mathematical Foundation:**
```
Polynomial: f(x) = a₀ + a₁x + a₂x² + ... + aₖ₋₁xᵏ⁻¹

Where:
- a₀ = the secret (master key)
- k = threshold (minimum shares needed)
- n = total shares created
```

**In Your Setup (5 shares, 3 threshold):**
```
f(x) = secret + a₁x + a₂x²

Share 1: f(1) = secret + a₁(1) + a₂(1)²
Share 2: f(2) = secret + a₁(2) + a₂(2)²
Share 3: f(3) = secret + a₁(3) + a₂(3)²
Share 4: f(4) = secret + a₁(4) + a₂(4)²
Share 5: f(5) = secret + a₁(5) + a₂(5)²
```

### Low-Level Unsealing Process

#### Phase 1: Vault Server Startup
```bash
[STARTUP] vault server -config=/vault/config/vault.hcl
[STORAGE] Initializing file storage backend at /vault/data
[CRYPTO]  Loading encrypted master key from storage
[STATUS]  Vault started in SEALED state (encrypted data inaccessible)
```

#### Phase 2: Unseal Key Collection
When you run `vault operator unseal <key>`:

**First Unseal Key:**
```bash
[INPUT]   Unseal key 1: AaBbCcDd...
[PROCESS] Store key fragment in memory
[STATUS]  Progress: 1/3 keys provided
[CRYPTO]  Cannot reconstruct polynomial yet (need 2 more)
[RESULT]  Vault remains SEALED
```

**Second Unseal Key:**
```bash
[INPUT]   Unseal key 2: EeFfGgHh...
[PROCESS] Store key fragment in memory
[STATUS]  Progress: 2/3 keys provided
[CRYPTO]  Cannot reconstruct polynomial yet (need 1 more)
[RESULT]  Vault remains SEALED
```

**Third Unseal Key (Threshold Reached):**
```bash
[INPUT]   Unseal key 3: IiJjKkLl...
[PROCESS] Store key fragment in memory
[STATUS]  Progress: 3/3 keys provided
[CRYPTO]  THRESHOLD REACHED - Begin reconstruction
[MATH]    Solve polynomial: f(0) = secret
[CRYPTO]  Master key reconstructed: 0x1a2b3c4d...
[STORAGE] Decrypt root key using master key
[CRYPTO]  Root key decrypted: 0x9f8e7d6c...
[STORAGE] Decrypt data encryption key using root key
[STATUS]  Vault UNSEALED - All operations now available
```

#### Phase 3: Key Hierarchy Activation
```
Master Key (from Shamir shares)
    ↓ decrypts
Root Key (stored encrypted in storage)
    ↓ decrypts  
Data Encryption Key
    ↓ decrypts
Actual secrets in storage backend
```

### Unsealing in Your Scripts

Looking at your `init-vault.sh`, here's what happens:

```bash
# From your init-vault.sh
unseal_vault() {
    local unseal_keys=($(cat "$VAULT_INIT_FILE" | jq -r '.keys[]'))
    
    for i in {0..2}; do
        # Each iteration adds one key to Vault's memory
        local unseal_response=$(curl -s -w "%{http_code}" -X POST "$VAULT_ADDR/v1/sys/unseal" \
            -H "Content-Type: application/json" \
            -d "{\"key\": \"${unseal_keys[$i]}\"}")
        
        # Vault responds with current unsealing progress
        local sealed_status=$(echo "$response_body" | jq -r '.sealed')
        local progress=$(echo "$response_body" | jq -r '.progress')
        
        # When progress reaches threshold (3), vault unseals
    done
}
```

**Low-Level HTTP Flow:**
```http
POST /v1/sys/unseal HTTP/1.1
Content-Type: application/json

{
  "key": "AaBbCcDdEeFf..."
}

HTTP/1.1 200 OK
{
  "sealed": true,
  "progress": 1,
  "threshold": 3,
  "version": "1.20.2"
}
```

---

## Deep Dive: AppRole Authentication Workflow

### Understanding AppRole Components

RoleID is an identifier that selects the AppRole against which the other credentials are evaluated. Think of it as a username for an application, while secret_id is required if bind_secret_id constraint is enabled.

#### Role-ID vs Secret-ID Security Model

**Role-ID (Public Identifier):**
- Static UUID: `role-12345678-1234-1234-1234-123456789012`
- Not a secret (can be in config files)
- Identifies which application role to use
- Like a username in traditional auth

**Secret-ID (Dynamic Secret):**  
- Temporary credential: `secret-abcd1234-5678-90ef-ghij-klmnopqrstuv`
- Highly sensitive (never in config files)
- Time-limited and usage-limited
- Like a password that expires

### AppRole Authentication Flow - Step by Step

#### Phase 1: Initial Setup (During Vault Deployment)

**1. Role Creation (in init-vault.sh):**
```bash
# Your script creates the role with policies
curl -X POST "$VAULT_ADDR/v1/auth/approle/role/app" \
  -H "X-Vault-Token: $VAULT_TOKEN" \
  -d '{
    "token_policies": ["app-policy"],
    "token_ttl": "1h",
    "token_max_ttl": "4h",
    "bind_secret_id": true
  }'
```

**Low-level Vault Processing:**
```
[APPROLE] Creating role 'app'
[STORAGE] Store role config: 
    policies=["app-policy"]
    ttl=3600s
    max_ttl=14400s
    bind_secret_id=true
[CRYPTO]  Generate role-id: role-12345678...
[STORAGE] Store role-id mapping: app -> role-12345678...
```

**2. Credential Generation:**
```bash
# Get role-id (static identifier)
role_id_response=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
    "$VAULT_ADDR/v1/auth/approle/role/app/role-id")

# Generate secret-id (dynamic credential)  
secret_id_response=$(curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
    -X POST "$VAULT_ADDR/v1/auth/approle/role/app/secret-id")
```

**Vault Internal Processing:**
```
[REQUEST] GET /v1/auth/approle/role/app/role-id
[LOOKUP]  Find role 'app' in storage
[RETURN]  role_id: "role-12345678-1234-1234-1234-123456789012"

[REQUEST] POST /v1/auth/approle/role/app/secret-id  
[CRYPTO]  Generate random secret-id: "secret-abcd1234..."
[STORAGE] Store secret-id with metadata:
    secret_id: "secret-abcd1234..."
    role: "app"
    created: 2024-01-15T10:30:00Z
    ttl: 0 (unlimited)
    uses_remaining: 0 (unlimited)
[RETURN]  secret_id: "secret-abcd1234..."
```

#### Phase 2: Credential Distribution

**Docker Secrets Creation:**
```bash
# From create-docker-secrets.sh
echo "$role_id" > "/tmp/vault-init/app-role-id"
echo "$secret_id" > "/tmp/vault-init/app-secret-id"

# Docker secrets created
docker secret create app-role-id "/tmp/vault-init/app-role-id"  
docker secret create app-secret-id "/tmp/vault-init/app-secret-id"
```

**Container Credential Access:**
```yaml
# In docker-compose files
secrets:
  - source: app-role-id
    target: /tmp/app-role-id
    mode: 0644
  - source: app-secret-id  
    target: /tmp/app-secret-id
    mode: 0644
```

#### Phase 3: Vault Agent Authentication

When vault-agent starts, here's the detailed flow:

**1. Credential Reading:**
```bash
# Vault agent reads from files
ROLE_ID=$(cat /tmp/app-role-id)      # "role-12345678..."
SECRET_ID=$(cat /tmp/app-secret-id)  # "secret-abcd1234..."
```

**2. Authentication Request:**
```http
POST /v1/auth/approle/login HTTP/1.1
Content-Type: application/json

{
  "role_id": "role-12345678-1234-1234-1234-123456789012",
  "secret_id": "secret-abcd1234-5678-90ef-ghij-klmnopqrstuv"
}
```

**3. Vault Server Processing:**
```
[REQUEST] AppRole login attempt
[LOOKUP]  Find role by role_id: "role-12345678..."
[FOUND]   Role: "app" 
[VERIFY]  Check secret_id: "secret-abcd1234..."
[STORAGE] Lookup secret_id in approle/secret_id/ namespace
[FOUND]   secret_id valid, belongs to role "app"
[CHECK]   Verify secret_id not expired (ttl check)
[CHECK]   Verify secret_id usage count not exceeded
[POLICY]  Load policies for role: ["app-policy"]
[TOKEN]   Generate client token:
    token: "hvs.CAESIJ1234567890abcdef..."
    ttl: 3600s (1 hour)
    renewable: true
    policies: ["app-policy"]
[AUDIT]   Log successful authentication:
    role_id: role-12345678... (logged)
    secret_id: secret-abcd1234... (hashed for security)
    client_token: hvs.CAESIJ...
    timestamp: 2024-01-15T10:31:15Z
```

**4. Authentication Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "auth": {
    "client_token": "hvs.CAESIJ1234567890abcdefghijklmnopqrstuvwxyz",
    "accessor": "hmac-sha256:abcd1234...",
    "policies": ["app-policy", "default"],
    "token_policies": ["app-policy", "default"],
    "metadata": {
      "role_name": "app"
    },
    "lease_duration": 3600,
    "renewable": true
  }
}
```

**5. Token Storage and Caching:**
```bash
# Vault agent stores token locally
echo "hvs.CAESIJ1234567890..." > /vault/agent/data/app-token

# Agent starts renewal process
[AGENT] Token stored, starting renewal loop
[AGENT] Token TTL: 3600s, will renew at 1800s (50% lifetime)
```

#### Phase 4: Secret Template Rendering

**1. Template Processing:**
Your vault agent config has templates like:
```hcl
template {
  source = "/vault/config/database.tpl"
  destination = "/vault/secrets/database.env" 
  perms = 0640
}
```

**2. Template Execution Flow:**
```
[TEMPLATE] Processing: /vault/config/database.tpl
[REQUEST]  GET /v1/secret/data/app/database
[AUTH]     Using cached token: hvs.CAESIJ...
[POLICY]   Check app-policy allows: secret/data/app/database
[ALLOWED]  Access granted
[FETCH]    Retrieve secret data:
    {
      "host": "postgres",
      "port": "5432", 
      "username": "app_user",
      "password": "secure_password_123"
    }
[RENDER]   Apply template:
    POSTGRES_HOST=postgres
    POSTGRES_PORT=5432
    POSTGRES_USER=app_user
    POSTGRES_PASSWORD=secure_password_123
[WRITE]    Output to: /vault/secrets/database.env
[PERMS]    Set permissions: 0640
```

**3. Template File Details:**
```bash
# Template source (/vault/config/database.tpl)
{{ with secret "secret/app/database" }}
POSTGRES_HOST={{ .Data.data.host }}
POSTGRES_PORT={{ .Data.data.port }}
POSTGRES_USER={{ .Data.data.username }}
POSTGRES_PASSWORD={{ .Data.data.password }}
{{ end }}

# Rendered output (/vault/secrets/database.env)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=app_user
POSTGRES_PASSWORD=secure_password_123
```

#### Phase 5: Application Integration

**Application Startup Process:**
```bash
# From your docker-compose.app.yml
command: ["/bin/bash", "-c", "set -a && source /vault/secrets/database.env && set +a && npm start"]
```

**Detailed Application Flow:**
```bash
[STARTUP] Container starting: user-service
[VAULT]   Wait for vault secrets to be available
[CHECK]   Test -f /vault/secrets/database.env
[FOUND]   Secrets file exists
[SOURCE]  Load environment variables:
    export POSTGRES_HOST=postgres
    export POSTGRES_PORT=5432  
    export POSTGRES_USER=app_user
    export POSTGRES_PASSWORD=secure_password_123
[APP]     Start application: npm start
[APP]     Database connection using sourced credentials
[SUCCESS] Application running with Vault-managed secrets
```

### Token Renewal and Lifecycle

**Automatic Renewal Process:**
```
Time: 0s     - Token issued (TTL: 3600s)
Time: 1800s  - Agent renews token (50% lifetime)
Time: 3300s  - Agent renews token again  
Time: 7200s  - Token reaches max_ttl (4h), must re-authenticate
```

**Renewal HTTP Request:**
```http
POST /v1/auth/token/renew-self HTTP/1.1
X-Vault-Token: hvs.CAESIJ1234567890...

{
  "increment": 3600
}
```

### Error Handling and Failure Scenarios

#### Unsealing Failures

**Scenario 1: Insufficient Unseal Keys**
```bash
[ERROR] Only 2 of 3 required keys provided
[STATE] Vault remains sealed
[LOGS]  {"error": "insufficient keys", "provided": 2, "required": 3}
[ACTION] Must provide additional valid unseal key
```

**Scenario 2: Invalid Unseal Key**  
```bash
[ERROR] Unseal key validation failed
[LOGS]  {"error": "invalid unseal key", "key_hash": "sha256:abc..."}
[STATE] Progress not incremented
[ACTION] Verify key from init file, check for corruption
```

**Scenario 3: Storage Backend Corruption**
```bash
[ERROR] Cannot read encrypted master key from storage
[LOGS]  {"error": "storage corruption", "path": "/vault/data/core/master"}
[ACTION] Restore from backup immediately
```

#### AppRole Authentication Failures

**Scenario 1: Secret-ID Expired**
```bash
[AUTH]  AppRole login attempt
[ERROR] secret_id expired at 2024-01-15T10:00:00Z
[LOGS]  {"role_id": "role-123...", "error": "secret_id_expired"}
[ACTION] Generate new secret-id and update Docker secret
```

**Scenario 2: Role-ID Not Found**
```bash
[AUTH]  AppRole login attempt  
[ERROR] role_id does not exist
[LOGS]  {"role_id": "invalid-role-123", "error": "role_not_found"}
[ACTION] Verify role creation, check role_id value
```

**Scenario 3: Policy Permission Denied**
```bash
[REQUEST] GET /v1/secret/data/app/database
[AUTH]    Token valid: hvs.CAESIJ...  
[POLICY]  app-policy evaluation
[ERROR]   Permission denied for path: secret/data/app/database
[LOGS]    {"path": "secret/data/app/database", "policy": "app-policy", "error": "permission_denied"}
[ACTION]  Update policy or verify secret path
```

### Advanced Operational Workflows

#### Workflow 1: Secret Rotation Process

**Manual Secret Rotation:**
```bash
# Step 1: Update secret in Vault
vault kv put secret/app/database \
  host=postgres \
  port=5432 \
  username=app_user \
  password=new_secure_password_456

# Step 2: Template re-rendering triggers automatically
[AGENT] Template change detected
[AGENT] Re-rendering /vault/secrets/database.env
[AGENT] Notifying dependent services

# Step 3: Application restart (if needed)  
docker service update --force ft-app_user-service
```

**Automated Database Rotation:**
```bash
# Using Vault's database secrets engine
vault write database/config/postgres \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@postgres:5432/ft_transcendence" \
  allowed_roles="app-db-role" \
  username="admin" \
  password="admin_password"

# Create role for dynamic credentials
vault write database/roles/app-db-role \
  db_name=postgres \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# Application gets fresh credentials every hour
[TEMPLATE] Requesting new database credentials
[REQUEST]  GET /v1/database/creds/app-db-role  
[VAULT]    Creating new database user: v-approle-app-db-role-abc123
[DATABASE] CREATE ROLE "v-approle-app-db-role-abc123" WITH LOGIN PASSWORD 'random_password'
[RETURN]   {"username": "v-approle-app-db-role-abc123", "password": "random_password"}
[CLEANUP]  Previous database user revoked after TTL
```

#### Workflow 2: High Availability Failover

**Primary Vault Failure:**
```bash
# Detection
[HEALTH] Primary vault health check failed
[STATUS] Vault unreachable at vault:8200
[ACTION] Failover to secondary vault instance

# Automatic failover in vault-agent
vault {
  address = "http://vault-primary:8200"
  retry {
    num_retries = 3
  }
}

# On failure, agent tries backup addresses
vault {
  address = "http://vault-secondary:8200"  
}
```

**Split-Brain Prevention:**
```bash
# Consul backend prevents split-brain
storage "consul" {
  address = "consul:8500"
  path = "vault/"
  consistency_mode = "strong"
}

# Only one Vault can be active at a time
[CONSUL] Leader election in progress
[VAULT1]  Attempting to acquire leadership
[VAULT2]  Waiting in standby mode
[RESULT]  VAULT1 becomes active, VAULT2 remains standby
```

#### Workflow 3: Disaster Recovery

**Complete Cluster Failure:**
```bash
# Step 1: Restore from backup
docker stack rm ft-vault
docker volume rm vault-data

# Step 2: Restore data
docker run --rm \
  -v vault-data:/data \
  -v $(pwd)/vault-backup.tar.gz:/backup.tar.gz \
  ubuntu tar xzf /backup.tar.gz -C /data

# Step 3: Deploy Vault stack
docker stack deploy -c docker-compose.vault.yml ft-vault

# Step 4: Manual unseal (automated unsealing won't work)
vault operator unseal <unseal-key-1>
vault operator unseal <unseal-key-2>  
vault operator unseal <unseal-key-3>

# Step 5: Verify secret access
vault kv get secret/app/database
```

**Partial Data Loss Recovery:**
```bash
# If some secrets are corrupted but Vault is operational
# Step 1: Identify missing/corrupted secrets
vault kv list secret/app/
vault kv get secret/app/database  # Returns error

# Step 2: Restore from environment backup
source /backup/.env.vault-restore

# Step 3: Re-populate affected secrets
vault kv put secret/app/database \
  host="${POSTGRES_HOST}" \
  port="${POSTGRES_PORT}" \
  username="${POSTGRES_USER}" \
  password="${POSTGRES_PASSWORD}"

# Step 4: Verify agents can access restored secrets  
docker service logs ft-app_vault-agent-app
```

### Performance Optimization

#### Agent Caching Behavior

**Cache Hit Scenario:**
```bash
[REQUEST] Application requests database.env
[AGENT]   Check local cache: /vault/secrets/database.env
[CACHE]   File exists, age: 30s, TTL: 3600s
[AGENT]   Return cached content (no Vault API call)
[METRICS] cache_hit=1, response_time=1ms
```

**Cache Miss Scenario:**
```bash
[REQUEST] Application requests new secret
[AGENT]   Check local cache: /vault/secrets/oauth.env  
[CACHE]   File not found or expired
[AGENT]   Request from Vault: GET /v1/secret/data/app/oauth
[VAULT]   Policy check passed, returning secret
[AGENT]   Render template, cache result
[METRICS] cache_miss=1, response_time=50ms
```

**Cache Invalidation:**
```bash
[VAULT]   Secret updated: secret/app/database (version 2)
[AGENT]   Webhook received: secret_updated
[CACHE]   Invalidate: /vault/secrets/database.env
[RENDER]  Re-render template with new secret
[NOTIFY]  Signal dependent services: SIGHUP to user-service
```

#### Load Balancing and Performance

**Multi-Agent Deployment:**
```yaml
# For high-load applications
vault-agent-app-primary:
  deploy:
    replicas: 2
    placement:
      constraints:
        - node.role == manager

vault-agent-app-cache:
  deploy:
    replicas: 3
    placement:
      constraints:
        - node.labels.vault-cache == true
```

**Request Distribution:**
```bash
# Round-robin to vault agents
[REQUEST] user-service -> vault-agent-app-1
[REQUEST] chat-service -> vault-agent-app-2  
[REQUEST] frontend -> vault-agent-app-1

# Agent-level caching reduces Vault server load
[METRICS] vault_agent_requests_total=1000
[METRICS] vault_server_requests_total=50  # 95% cache hit rate
```

### Security Hardening

#### Network Security Implementation

**Network Segmentation Details:**
```yaml
# Vault network - only vault services
networks:
  vault-network:
    driver: overlay
    encrypted: true  # Encrypt inter-node communication
    ipam:
      config:
        - subnet: "172.20.0.0/16"

# Firewall rules (iptables)  
-A INPUT -s 172.20.0.0/16 -p tcp --dport 8200 -j ACCEPT  # Vault agents only
-A INPUT -p tcp --dport 8200 -j DROP                     # Block external access
```

**Certificate-based Authentication:**
```hcl
# Enhanced vault-agent config with TLS
vault {
  address = "https://vault:8200"
  tls_cert_file = "/vault/certs/agent.crt"
  tls_key_file = "/vault/certs/agent.key"  
  tls_ca_file = "/vault/certs/ca.crt"
}

# Mutual TLS authentication
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_cert_file = "/vault/certs/vault.crt"
  tls_key_file = "/vault/certs/vault.key"
  tls_require_and_verify_client_cert = true
  tls_client_ca_file = "/vault/certs/ca.crt"
}
```

#### Audit and Compliance

**Detailed Audit Logging:**
```bash
# Enable comprehensive auditing
vault audit enable file file_path=/vault/logs/audit.log format=json

# Sample audit entry
{
  "time": "2024-01-15T10:30:45.123Z",
  "type": "request", 
  "auth": {
    "client_token": "hmac-sha256:abc123...",
    "accessor": "hmac-sha256:def456...",
    "display_name": "approle-app",
    "policies": ["app-policy", "default"]
  },
  "request": {
    "id": "req-789abc...",
    "operation": "read",
    "path": "secret/data/app/database",
    "client_ip": "172.20.0.5",
    "remote_address": "172.20.0.5:45678"
  },
  "response": {
    "status_code": 200,
    "secret": {
      "lease_id": "secret/app/database:lease-xyz789"
    }
  }
}
```

**Compliance Reporting:**
```bash
# Generate access reports
jq '.request.path' /vault/logs/audit.log | sort | uniq -c
#   245 secret/data/app/database
#   123 secret/data/app/redis
#    67 secret/data/app/jwt

# Failed authentication attempts
jq 'select(.response.status_code >= 400)' /vault/logs/audit.log

# Policy violations  
jq 'select(.error != null and (.error | contains("permission denied")))' /vault/logs/audit.log
```



### Components Explained

#### 1. Vault Server (`vault`)

**Purpose:** Central secrets storage and management

**Key Features:**
- Stores all sensitive data encrypted
- Handles authentication requests
- Manages access policies
- Provides audit logging

**Configuration Location:** `services/devops/vault/config/vault.hcl`

#### 2. Vault Initialization Service (`vault-init`)

**Purpose:** Automatically initialize Vault on first startup

**What it does:**
- Creates master keys for unsealing Vault
- Generates root token for administration
- Sets up initial configuration
- Creates AppRole credentials

#### 3. Vault Secret Populator (`vault-populate`)

**Purpose:** Loads your environment variables into Vault

**Process:**
1. Reads `.env` file
2. Organizes secrets by category (app, logging, monitoring)
3. Stores them in Vault's KV engine
4. Creates user accounts

#### 4. Vault Agents

**Purpose:** Local proxy for applications to access secrets

**Types in our setup:**
- **App Agent**: Serves main application secrets
- **Logging Agent**: Serves ELK stack secrets  
- **Monitoring Agent**: Serves Prometheus/Grafana secrets

**Benefits:**
- Caching for performance
- Automatic token renewal
- Template rendering for environment files

#### 5. Docker Secrets Creator

**Purpose:** Converts Vault AppRole credentials to Docker secrets

**Why needed:**
- Docker Swarm services need credentials to authenticate with Vault
- Provides secure way to bootstrap the authentication process

---

### Configuration Files Explained

#### Vault Server Configuration (`vault.hcl`)

```hcl
# Disable memory swapping for security
disable_mlock = true

# Storage backend - where secrets are stored
storage "file" {
  path = "/vault/data"
}

# Network listener - how clients connect
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = true  # Only for internal Docker network
}

# Web UI configuration
ui = true
```

**Key Points:**
- **File storage**: Secrets stored in `/vault/data` directory
- **Port 8200**: Standard Vault API port
- **TLS disabled**: Only within Docker network (Traefik handles external TLS)

#### Vault Agent Configuration

Each service type has its own agent configuration:

**App Agent (`vault-agent-app.hcl`)**:
```hcl
# Authentication method
auto_auth {
  method "approle" {
    mount_path = "auth/approle"
    config = {
      role_id_file_path = "/tmp/app-role-id"
      secret_id_file_path = "/tmp/app-secret-id"  
    }
  }
}

# Template for environment file
template {
  source = "/vault/config/database.tpl"
  destination = "/vault/secrets/database.env"
}
```

**Template Files:**
Templates convert Vault secrets into environment files your applications can use.

Example - Database Template (`database.tpl`):
```bash
{{ with secret "secret/app/database" }}
POSTGRES_HOST={{ .Data.data.host }}
POSTGRES_PORT={{ .Data.data.port }}
POSTGRES_USER={{ .Data.data.username }}  
POSTGRES_PASSWORD={{ .Data.data.password }}
{{ end }}
```

#### Policy Files

Policies control access to secrets:

**App Policy (`app-policy.hcl`)**:
```hcl
# Allow reading app secrets
path "secret/data/app/*" {
  capabilities = ["read"]
}

# Allow token operations
path "auth/token/renew-self" {
  capabilities = ["update"]
}
```

## Troubleshooting

### Common Issues and Solutions

**1. Vault Sealed After Restart**

*Symptoms:* Applications can't access secrets, Vault UI shows "Sealed"

*Cause:* Vault automatically seals on restart for security

*Solution:*
```bash
# Check seal status
vault status

# Unseal manually (need 3 out of 5 keys)
vault operator unseal <key1>
vault operator unseal <key2>  
vault operator unseal <key3>
```

**2. AppRole Authentication Failed**

*Symptoms:* Vault agent can't authenticate, missing secret files

*Solution:*
```bash
# Check if Docker secrets exist
docker secret ls | grep role-id

# Verify secret files in container
docker exec -it <vault-agent-container> ls -la /tmp/
docker exec -it <vault-agent-container> cat /tmp/app-role-id
```

**3. Template Rendering Issues**

*Symptoms:* Environment files not generated, applications failing to start

*Solution:*
```bash
# Check agent logs
docker service logs ft-app_vault-agent-app

# Test template manually
vault agent -config=/vault/config/vault-agent.hcl -log-level=debug
```

**4. Network Connectivity Issues**

*Symptoms:* Services can't reach Vault server

*Solution:*
```bash
# Check network connectivity
docker exec -it <service-container> ping vault
docker exec -it <service-container> curl http://vault:8200/v1/sys/health

# Check network configuration
docker network ls
docker network inspect vault-network
```

### Debugging Commands

**Vault Server Logs:**
```bash
docker service logs -f ft-vault_vault
docker service logs -f ft-vault_vault-init  
docker service logs -f ft-vault_vault-populate
```

**Service Health Checks:**
```bash
# Check all vault services
docker service ps ft-vault_vault
docker service ps ft-vault_vault-agent-app

# Check specific container health
docker ps --filter label=com.docker.swarm.service.name=ft-vault_vault
```

**Secret Verification:**
```bash
# List secrets in Vault
vault kv list secret/app/
vault kv get secret/app/database

# Check Docker secrets
docker secret ls
docker secret inspect app-role-id
```

---
### Emergency Procedures

**1. Vault Compromise Response**
```bash
# Immediately seal Vault
vault operator seal

# Rotate all secrets
vault auth tune -max-lease-ttl=1h approle/
vault auth tune -default-lease-ttl=30m approle/

# Generate new unseal keys
vault operator rekey -init -key-shares=5 -key-threshold=3
```

**2. Disaster Recovery**
```bash
# Restore from backup
docker stack rm ft-vault
docker volume rm vault-data
docker run --rm -v vault-data:/data -v $(pwd)/vault-backup.tar.gz:/backup.tar.gz ubuntu tar xzf /backup.tar.gz -C /data
docker stack deploy -c docker-compose.vault.yml ft-vault
```
---
