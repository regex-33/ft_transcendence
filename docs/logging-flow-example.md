## Overview
This documentation explains how logs flow from the ft-transcendence application through Filebeat → Logstash → Elasticsearch → Kibana for visualization and analysis.

## Architecture Flow
```
Application Logs → Filebeat → Logstash → Elasticsearch → Kibana
(/var/log/ft-transcendence/)
```

---

## Step 1: Log Generation

### Generated Log Structure
The `GenLogs-user-service.py` script generates three types of logs in `/var/log/ft-transcendence/user-service/`:

#### 1. User Logs (`user.log`)
**Sample Generated Entry:**
```json
{
  "timestamp": "2023-12-25T14:30:15.123Z",
  "level": "INFO",
  "service": "user-service",
  "request_id": "req_a1b2c3d4e5f6",
  "user_id": "user_0042",
  "username": "john_doe",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "login",
  "success": true,
  "message": "User john_doe logged in successfully",
  "login_method": "password",
  "response_time": 1.234,
  "database_queries": 3,
  "cache_hits": 1
}
```

#### 2. Access Logs (`user-access.log`)
**Sample Generated Entry:**
```json
{
  "timestamp": "2023-12-25T14:30:16.456Z",
  "level": "INFO",
  "service": "user-service",
  "request_id": "req_b2c3d4e5f6g7",
  "user_id": "user_0042",
  "username": "john_doe",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "request": {
    "method": "POST",
    "url": "/api/v1/users/login",
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "size": 256,
    "content_type": "application/json"
  },
  "response": {
    "status": 200,
    "time": 0.234,
    "duration": 234.56,
    "size": 1024
  },
  "message": "POST /api/v1/users/login - 200"
}
```

#### 3. Error Logs (`user-error.log`)
**Sample Generated Entry:**
```json
{
  "timestamp": "2023-12-25T14:30:17.789Z",
  "level": "ERROR",
  "service": "user-service",
  "request_id": "req_c3d4e5f6g7h8",
  "user_id": "user_0043",
  "username": "jane_smith",
  "session_id": "660f9500-f39c-52e5-b827-557766551111",
  "error_code": "validation_error",
  "success": false,
  "error": "Invalid input data provided",
  "message": "Error in user service: Invalid input data provided",
  "validation_errors": ["email_format", "password_length"],
  "request": {
    "method": "POST",
    "url": "/api/v1/users/register",
    "ip": "192.168.1.101"
  },
  "stack_trace": [
    "com.fttranscendence.user.service.UserService.processRequest(UserService.java:145)",
    "com.fttranscendence.user.controller.UserController.handleRequest(UserController.java:89)"
  ]
}
```

---

## Step 2: Filebeat Collection - Complete Processing Pipeline

### Filebeat Internal Processing Steps

#### **STEP 1: File Discovery and Monitoring**

**Filebeat Startup Process:**
```yaml
filebeat.inputs:
- type: filestream
  id: user-service-logs
  enabled: true
  paths:
    - /var/log/ft-transcendence/user-service/*.log
```

**File System Scanning:**
1. **Initial Scan:** Filebeat scans `/var/log/ft-transcendence/user-service/` directory
2. **File Discovery:** Finds files matching `*.log` pattern:
   - `/var/log/ft-transcendence/user-service/user.log`
   - `/var/log/ft-transcendence/user-service/user-access.log` 
   - `/var/log/ft-transcendence/user-service/user-error.log`

3. **File Metadata Collection:**
   ```json
   {
     "file_path": "/var/log/ft-transcendence/user-service/user.log",
     "file_size": 15678,
     "inode": 1234567,
     "device_id": 2049,
     "last_modified": "2023-12-25T14:30:15.123Z"
   }
   ```

4. **Registry State:** Filebeat creates registry entries to track read position
   ```json
   {
     "source": "/var/log/ft-transcendence/user-service/user.log",
     "offset": 0,
     "timestamp": "2023-12-25T14:30:15.123Z",
     "ttl": -1
   }
   ```

**Continuous Monitoring:**
- **Inotify Events:** Watches for file modifications using Linux inotify
- **Polling Interval:** Default 10s backup polling for file changes
- **New File Detection:** Automatically picks up new `*.log` files

---

#### **STEP 2: Raw Log Line Reading**

**Log File Content (example from user.log):**
```
{"timestamp":"2023-12-25T14:30:15.123Z","level":"INFO","service":"user-service","request_id":"req_a1b2c3d4e5f6","user_id":"user_0042","username":"john_doe","session_id":"550e8400-e29b-41d4-a716-446655440000","action":"login","success":true,"message":"User john_doe logged in successfully","login_method":"password","response_time":1.234,"database_queries":3,"cache_hits":1}
{"timestamp":"2023-12-25T14:30:16.456Z","level":"INFO","service":"user-service","request_id":"req_b2c3d4e5f6g7","user_id":"user_0042","username":"john_doe","session_id":"550e8400-e29b-41d4-a716-446655440000","action":"profile_view","success":true,"message":"User john_doe viewed profile","response_time":0.456}
```

**Line-by-Line Processing:**
1. **Offset Tracking:** Current position: `offset: 0`
2. **Line Reading:** Read until newline character `\n`
3. **First Line:** `{"timestamp":"2023-12-25T14:30:15.123Z",...}`
4. **Offset Update:** New position: `offset: 285` (length of first line + 1)
5. **Registry Update:** Store new offset in registry for crash recovery

---

#### **STEP 3: Initial Event Creation**

**Base Event Structure (before any processing):**
```json
{
  "@timestamp": "2023-12-25T14:30:15.123Z",  // ← File modification time or current time
  "message": "{\"timestamp\":\"2023-12-25T14:30:15.123Z\",\"level\":\"INFO\",\"service\":\"user-service\",\"request_id\":\"req_a1b2c3d4e5f6\",\"user_id\":\"user_0042\",\"username\":\"john_doe\",\"session_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"action\":\"login\",\"success\":true,\"message\":\"User john_doe logged in successfully\",\"login_method\":\"password\",\"response_time\":1.234,\"database_queries\":3,\"cache_hits\":1}",
  "input": {
    "type": "filestream"  // ← Input type
  },
  "log": {
    "file": {
      "path": "/var/log/ft-transcendence/user-service/user.log",
      "device_id": 2049,
      "inode": 1234567,
      "offset": 285
    }
  }
}
```

---

#### **STEP 4: Input-Level Field Addition**

**Configuration Fields Applied:**
```yaml
fields:
  logtype: user-service
  service: user-service
  environment: "${ENVIRONMENT:development}"
  service_group: ft-transcendence
  datacenter: "${DATACENTER:local}"
fields_under_root: true
```

**Environment Variable Resolution:**
- `${ENVIRONMENT:development}` → Checks env var `ENVIRONMENT`, defaults to "development"
- `${DATACENTER:local}` → Checks env var `DATACENTER`, defaults to "local"

**Event After Field Addition:**
```json
{
  "@timestamp": "2023-12-25T14:30:15.123Z",
  "message": "{\"timestamp\":\"2023-12-25T14:30:15.123Z\",...}",
  "input": {"type": "filestream"},
  "log": {
    "file": {
      "path": "/var/log/ft-transcendence/user-service/user.log",
      "device_id": 2049,
      "inode": 1234567, 
      "offset": 285
    }
  },
  // NEW FIELDS ADDED:
  "logtype": "user-service",        // ← From fields.logtype
  "service": "user-service",        // ← From fields.service
  "environment": "development",     // ← From fields.environment 
  "service_group": "ft-transcendence", // ← From fields.service_group
  "datacenter": "local"            // ← From fields.datacenter
}
```

---

#### **STEP 5: JSON Processing (Input Level)**

**JSON Configuration:**
```yaml
json.keys_under_root: false
json.add_error_key: true
```

**JSON Detection:** Filebeat detects the message starts with `{` and attempts JSON parsing

**Parsing Result:**
```json
// Since keys_under_root: false, JSON is NOT parsed at input level
// Message remains as raw string for Logstash to process
// json.add_error_key: true means if parsing fails, add "json_error" field
```

**Event After JSON Processing (unchanged because keys_under_root: false):**
```json
{
  "@timestamp": "2023-12-25T14:30:15.123Z",
  "message": "{\"timestamp\":\"2023-12-25T14:30:15.123Z\",...}", // ← Still raw JSON string
  "logtype": "user-service",
  "service": "user-service", 
  "environment": "development",
  "service_group": "ft-transcendence",
  "datacenter": "local",
  "input": {"type": "filestream"},
  "log": {"file": {...}}
}
```

---

#### **STEP 6: Processor Pipeline Execution**

**Processors Configuration:**
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
  - timestamp:
      field: "@timestamp"
      layouts:
        - '2006-01-02T15:04:05.000Z'
        - '2006-01-02T15:04:05Z' 
        - '2006-01-02 15:04:05'
      test:
        - '2023-12-25T09:30:00.000Z'
```

##### **Processor 1: add_host_metadata**
```yaml
- add_host_metadata:
    when.not.contains.tags: forwarded
```

**Condition Check:** `when.not.contains.tags: forwarded`
- Current tags: `[]` (empty)
- Condition: TRUE (no "forwarded" tag exists)
- **Action:** Execute processor

**System Information Gathering:**
```bash
# Filebeat executes system calls:
hostname                    # → "filebeat-container"
uname -a                   # → Linux info
cat /proc/cpuinfo         # → CPU architecture
cat /etc/os-release       # → OS information
ip addr show              # → Network interfaces
cat /proc/version         # → Kernel version
```

**Fields Added:**
```json
{
  "host": {
    "name": "filebeat-container",
    "id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "hostname": "filebeat-container", 
    "architecture": "x86_64",
    "os": {
      "name": "Ubuntu",
      "family": "debian", 
      "version": "20.04.3 LTS (Focal Fossa)",
      "kernel": "5.4.0-96-generic",
      "codename": "focal",
      "type": "linux",
      "platform": "ubuntu"
    },
    "containerized": true,
    "ip": ["172.18.0.5", "127.0.0.1"],
    "mac": ["02:42:ac:12:00:05"]
  }
}
```

##### **Processor 2: add_docker_metadata**
```yaml
- add_docker_metadata:
    host: "unix:///var/run/docker.sock"
```

**Docker Socket Communication:**
```bash
# Filebeat makes Docker API calls:
GET /containers/json              # List all containers
GET /containers/{id}/json         # Get container details
GET /images/{id}/json            # Get image information
```

**Container Discovery:**
1. **Current Process PID:** Filebeat gets its own PID
2. **Cgroup Detection:** Reads `/proc/self/cgroup` to find container ID
3. **Container Lookup:** Queries Docker API for container details
4. **Metadata Extraction:** Gets container name, image, labels

**Fields Added:**
```json
{
  "container": {
    "id": "f1e2d3c4b5a67890123456789abcdef0123456789abcdef0123456789abcdef",
    "name": "ft-transcendence-filebeat-1",
    "image": {
      "name": "docker.elastic.co/beats/filebeat:8.15.0",
      "tag": ["8.15.0"]
    },
    "labels": {
      "com.docker.compose.project": "ft-transcendence",
      "com.docker.compose.service": "filebeat", 
      "com.docker.compose.version": "2.20.2",
      "com.docker.compose.container-number": "1"
    }
  }
}
```

##### **Processor 3: drop_event**
```yaml
- drop_event:
    when:
      regexp:
        message: "^\\s*$"
```

**Regex Pattern:** `^\\s*## Step 3: Logstash Processing - Detailed Pipeline Analysis

### Complete Logstash Pipeline Flow (`main.conf`)

#### Input Section - Event Reception
```ruby
input {
  beats {
    port => 5044
  }
}
```

**What Happens:**
- Logstash opens TCP port 5044 and waits for Filebeat connections
- Receives the complete Filebeat event structure shown above
- Each event enters the filter pipeline with ALL fields intact

**Input Event (Complete Structure from Filebeat):**
```json
{
  "@timestamp": "2023-12-25T14:30:15.123Z",
  "message": "{\"timestamp\":\"2023-12-25T14:30:15.123Z\",\"level\":\"INFO\",\"service\":\"user-service\",\"request_id\":\"req_a1b2c3d4e5f6\",\"user_id\":\"user_0042\",\"username\":\"john_doe\",\"session_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"action\":\"login\",\"success\":true,\"message\":\"User john_doe logged in successfully\",\"login_method\":\"password\",\"response_time\":1.234,\"database_queries\":3,\"cache_hits\":1}",
  "logtype": "user-service",
  "service": "user-service", 
  "environment": "development",
  "service_group": "ft-transcendence",
  "datacenter": "local",
  "host": {
    "name": "filebeat-container",
    "id": "a1b2c3d4e5f6",
    "hostname": "filebeat-container",
    "architecture": "x86_64",
    "os": {
      "name": "Ubuntu",
      "family": "debian",
      "version": "20.04.3 LTS",
      "kernel": "5.4.0-96-generic"
    }
  },
  "log": {
    "file": {
      "path": "/var/log/ft-transcendence/user-service/user.log",
      "offset": 1024
    }
  },
  "agent": {
    "name": "filebeat-container",
    "type": "filebeat",
    "version": "8.15.0",
    "ephemeral_id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
  },
  "ecs": {
    "version": "8.15.0"
  }
}
```

---

#### Filter Section - Step-by-Step Transformation

##### **STEP 1: Add Processing Metadata**
```ruby
mutate {
  add_field => { "[@metadata][received_at]" => "%{@timestamp}" }
}
```

**Before:** `[@metadata]` is empty
**After:** 
```json
{
  "[@metadata]": {
    "received_at": "2023-12-25T14:30:15.123Z"
  }
}
```

**Purpose:** Track when Logstash received the event for debugging

---

##### **STEP 2: Extract Service Name from File Path**
```ruby
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

**Input Field:** `"[log][file][path]": "/var/log/ft-transcendence/user-service/user.log"`

**Grok Pattern Matching:**
1. **Pattern 1:** `/var/log/ft-transcendence/(?<extracted_service>[^/]+)/.*`
   - **Match:** `/var/log/ft-transcendence/user-service/user.log`
   - **Captured:** `extracted_service = "user-service"`
   - **Result:** SUCCESS

2. **Pattern 2 & 3:** Not tried (first pattern matched)

**After Processing:**
```json
{
  "extracted_service": "user-service",
  // No failure tags added
}
```

**Alternative Examples:**
- `/var/log/nginx/ft-transcendence-api-gateway-access.log` → `extracted_service = "api"`
- `/var/log/nginx/access.log` → `extracted_service = "nginx"`
- `/invalid/path/structure` → Adds tag `["_grokparsefailure_service_extraction"]`

---

##### **STEP 3: Service Name Priority Resolution**
```ruby
if [extracted_service] {
  mutate {
    add_field => { "service_name" => "%{extracted_service}" }
  }
} else if [service] {
  mutate {
    add_field => { "service_name" => "%{service}" }
  }
}
```

**Logic Flow:**
1. **Check `extracted_service`:** `"user-service"` exists
2. **Execute first branch:**
   ```json
   {
     "service_name": "user-service"  // ← NEW FIELD ADDED
   }
   ```
3. **Skip second branch** (else if not executed)

**Priority Order:**
1. `extracted_service` (from file path) - **HIGHEST**
2. `service` (from Filebeat config) - **FALLBACK**

---

##### **STEP 4: JSON Detection and Parsing**
```ruby
if [message] =~ /^\s*\{.*\}\s*$/ {
  json {
    source => "message"
    target => "parsed_json"
    skip_on_invalid_json => true
  }
}
```

**Regex Breakdown:**
- `^\s*` - Start of line + optional whitespace
- `\{.*\}` - Curly braces with any content
- `\s* - Optional whitespace + end of line

**Input Message:**
```
{"timestamp":"2023-12-25T14:30:15.123Z","level":"INFO","service":"user-service","request_id":"req_a1b2c3d4e5f6","user_id":"user_0042","username":"john_doe","session_id":"550e8400-e29b-41d4-a716-446655440000","action":"login","success":true,"message":"User john_doe logged in successfully","login_method":"password","response_time":1.234,"database_queries":3,"cache_hits":1}
```

**Regex Match:** TRUE (valid JSON structure)

**JSON Parsing Result:**
```json
{
  "parsed_json": {
    "timestamp": "2023-12-25T14:30:15.123Z",
    "level": "INFO", 
    "service": "user-service",
    "request_id": "req_a1b2c3d4e5f6",
    "user_id": "user_0042",
    "username": "john_doe",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "action": "login",
    "success": true,
    "message": "User john_doe logged in successfully",
    "login_method": "password",
    "response_time": 1.234,
    "database_queries": 3,
    "cache_hits": 1
  }
}
```

**Error Handling:** If JSON is invalid, `skip_on_invalid_json: true` means:
- No `parsed_json` field created
- No error thrown
- Processing continues to next filter

---

##### **STEP 5: Basic Field Extraction from JSON**
```ruby
if [parsed_json] {
  if [parsed_json][timestamp] {
    mutate { add_field => { "log_timestamp" => "%{[parsed_json][timestamp]}" } }
  }
  if [parsed_json][level] {
    mutate { add_field => { "log_level" => "%{[parsed_json][level]}" } }
  }
  // ... (continues for all basic fields)
}
```

**Conditional Processing:** Each field is extracted only if it exists in the parsed JSON

**Field-by-Field Extraction:**

1. **Timestamp:**
   ```ruby
   if [parsed_json][timestamp] {
     mutate { add_field => { "log_timestamp" => "%{[parsed_json][timestamp]}" } }
   }
   ```
   **Result:** `"log_timestamp": "2023-12-25T14:30:15.123Z"`

2. **Log Level:**
   ```ruby
   if [parsed_json][level] {
     mutate { add_field => { "log_level" => "%{[parsed_json][level]}" } }
   }
   ```
   **Result:** `"log_level": "INFO"`

3. **Log Message:**
   ```ruby
   if [parsed_json][message] {
     mutate { add_field => { "log_message" => "%{[parsed_json][message]}" } }
   }
   ```
   **Result:** `"log_message": "User john_doe logged in successfully"`

**Complete Basic Fields Added:**
```json
{
  "log_timestamp": "2023-12-25T14:30:15.123Z",
  "log_level": "INFO",
  "log_message": "User john_doe logged in successfully", 
  "log_service": "user-service",
  "request_id": "req_a1b2c3d4e5f6",
  "user_id": "user_0042",
  "username": "john_doe",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "login",
  "success": "true"  // ← Note: boolean converted to string
}
```

---

##### **STEP 6: Complex Object Parsing - Request Object**
```ruby
if [parsed_json][request] {
  if [parsed_json][request][method] {
    mutate { add_field => { "request_method" => "%{[parsed_json][request][method]}" } }
  }
  if [parsed_json][request][url] {
    mutate { add_field => { "request_url" => "%{[parsed_json][request][url]}" } }
  }
  if [parsed_json][request][ip] {
    mutate { add_field => { "request_ip" => "%{[parsed_json][request][ip]}" } }
  }
  if [parsed_json][request][user_agent] {
    mutate { add_field => { "request_user_agent" => "%{[parsed_json][request][user_agent]}" } }
  }
}
```

**For Access Logs (when request object exists):**

**Input JSON Request Object:**
```json
{
  "request": {
    "method": "POST",
    "url": "/api/v1/users/login", 
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
}
```

**Fields Added:**
```json
{
  "request_method": "POST",
  "request_url": "/api/v1/users/login",
  "request_ip": "192.168.1.100", 
  "request_user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
```

**For Basic User Logs (no request object):**
- No fields added
- Processing continues without error

---

##### **STEP 7: Complex Object Parsing - Response Object**
```ruby
if [parsed_json][response] {
  if [parsed_json][response][status] {
    mutate { add_field => { "response_status" => "%{[parsed_json][response][status]}" } }
  }
  if [parsed_json][response][time] {
    mutate { add_field => { "response_time" => "%{[parsed_json][response][time]}" } }
  }
  if [parsed_json][response][duration] {
    mutate { add_field => { "response_duration" => "%{[parsed_json][response][duration]}" } }
  }
}
```

**For Access Logs:**
```json
{
  "response_status": "200",     // ← String from JSON
  "response_time": "0.234",     // ← String from JSON  
  "response_duration": "234.56" // ← String from JSON
}
```

---

##### **STEP 8: Error Information Extraction**
```ruby
if [parsed_json][error] {
  mutate { add_field => { "error_message" => "%{[parsed_json][error]}" } }
}
if [parsed_json][error_reason] {
  mutate { add_field => { "error_reason" => "%{[parsed_json][error_reason]}" } }
}
if [parsed_json][error_code] {
  mutate { add_field => { "error_code" => "%{[parsed_json][error_code]}" } }
}
```

**For Error Logs:**
```json
{
  "error_message": "Invalid input data provided",
  "error_code": "validation_error",
  "error_reason": "connection_timeout"
}
```

**For Success Logs:** No fields added (conditions not met)

---

##### **STEP 9: Application-Specific Field Extraction**

**Game Service Fields:**
```ruby
if [parsed_json][game_id] {
  mutate { add_field => { "game_id" => "%{[parsed_json][game_id]}" } }
}
if [parsed_json][match_id] {
  mutate { add_field => { "match_id" => "%{[parsed_json][match_id]}" } }
}
```

**Chat Service Fields:**
```ruby
if [parsed_json][message_id] {
  mutate { add_field => { "message_id" => "%{[parsed_json][message_id]}" } }
}
if [parsed_json][channel_id] {
  mutate { add_field => { "channel_id" => "%{[parsed_json][channel_id]}" } }
}
```

**Security Fields:**
```ruby
if [parsed_json][security_event] {
  mutate { add_field => { "security_event" => "%{[parsed_json][security_event]}" } }
}
if [parsed_json][threat_level] {
  mutate { add_field => { "threat_level" => "%{[parsed_json][threat_level]}" } }
}
```

**For User Service:** Most of these conditions are false, so no additional fields added

---

##### **STEP 10: Service Name Fallback Logic**
```ruby
if [parsed_json][service] and ![service_name] {
  mutate { add_field => { "service_name" => "%{[parsed_json][service]}" } }
}
```

**Current State:** `service_name` already exists as "user-service"
**Condition:** `![service_name]` is FALSE
**Result:** This block is skipped

---

##### **STEP 11: Cleanup Parsed JSON**
```ruby
mutate {
  remove_field => [ "parsed_json" ]
}
```

**Before:** Event contains the entire `parsed_json` object (large)
**After:** `parsed_json` field is completely removed
**Benefit:** Reduces event size by ~50% while keeping extracted fields

---

##### **STEP 12: Non-JSON Log Processing (Alternative Path)**

**For non-JSON logs (Nginx, system logs):**

```ruby
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

**Apache Log Format Pattern:**
```
%{IPORHOST:clientip} %{USER:ident} %{USER:auth} \[%{HTTPDATE:timestamp}\] "(?:%{WORD:verb} %{URIPATH:request}(?: HTTP/%{NUMBER:httpversion})?)" %{NUMBER:response} (?:%{NUMBER:bytes}|-)
```

**Example Nginx Log:**
```
192.168.1.100 - - [25/Dec/2023:14:30:15 +0000] "POST /api/v1/users/login HTTP/1.1" 200 1024 "-" "Mozilla/5.0..."
```

**Extracted Fields:**
```json
{
  "clientip": "192.168.1.100",
  "verb": "POST", 
  "request": "/api/v1/users/login",
  "response": "200",
  "bytes": "1024"
}
```

---

##### **STEP 13: Timestamp Processing**
```ruby
if [log_timestamp] {
  date {
    match => [ "log_timestamp", "ISO8601", "yyyy-MM-dd HH:mm:ss,SSS", "yyyy-MM-dd HH:mm:ss.SSS" ]
    target => "@timestamp"
  }
}
```

**Input:** `"log_timestamp": "2023-12-25T14:30:15.123Z"`

**Pattern Matching:**
1. **ISO8601:** `2023-12-25T14:30:15.123Z` MATCH
2. **Other patterns:** Not tried (first match succeeded)

**Before:** `"@timestamp": "2023-12-25T14:30:15.123Z"` (Filebeat timestamp)
**After:** `"@timestamp": "2023-12-25T14:30:15.123Z"` (Original log timestamp)

**Result:** Uses the application's original timestamp instead of file processing time

---

##### **STEP 14: Log Level Normalization**
```ruby
if [log_level] {
  mutate {
    uppercase => [ "log_level" ]
  }
}
```

**Input:** `"log_level": "info"` or `"log_level": "Info"`
**Output:** `"log_level": "INFO"`

**Benefit:** Standardizes log levels for consistent filtering in Kibana

---

##### **STEP 15: Data Type Conversions**
```ruby
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
if [response_duration] {
  mutate {
    convert => { "response_duration" => "float" }
  }
}
```

**String to Integer Conversion:**
```ruby
# Before: "response_status": "200" (string)
# After:  "response_status": 200 (integer)
```

**String to Float Conversion:**
```ruby
# Before: "response_time": "1.234" (string)  
# After:  "response_time": 1.234 (float)
```

**Elasticsearch Mapping Impact:**
- Integer fields can be used for numerical aggregations
- Float fields support decimal operations
- String fields are only good for text search

---

##### **STEP 16: Environment and Datacenter Processing**
```ruby
if [environment] {
  mutate {
    add_field => { "env" => "%{environment}" }
  }
}

if [datacenter] {
  mutate {
    add_field => { "dc" => "%{datacenter}" }
  }
}
```

**Input:** From Filebeat configuration
- `"environment": "development"`
- `"datacenter": "local"`

**Added Fields:**
```json
{
  "env": "development",
  "dc": "local"
}
```

**Purpose:** Shorter field names for dashboard filters

---

##### **STEP 17: Final Service Name Resolution**
```ruby
if ![service_name] and [log_service] {
  mutate {
    add_field => { "service_name" => "%{log_service}" }
  }
}
```

**Current State:** `service_name` exists as "user-service"
**Condition:** `![service_name]` is FALSE
**Result:** Skipped (fallback not needed)

---

##### **STEP 18: Service-Specific Tagging**
```ruby
if [service_name] {
  if [service_name] == "auth-service" {
    mutate { add_tag => [ "authentication", "security" ] }
  } else if [service_name] == "api-gateway" {
    mutate { add_tag => [ "gateway", "routing" ] }
  } else if [service_name] == "chat-service" {
    mutate { add_tag => [ "messaging", "realtime" ] }
  } else if [service_name] == "game-service" {
    mutate { add_tag => [ "gaming", "realtime" ] }
  } else if [service_name] == "user-service" {
    mutate { add_tag => [ "user-management" ] }
  } else if [service_name] =~ /security/ {
    mutate { add_tag => [ "security", "monitoring" ] }
  }
}
```

**Input:** `"service_name": "user-service"`
**Matching Condition:** `[service_name] == "user-service"` TRUE
**Result:** 
```json
{
  "tags": ["user-management"]  // ← NEW FIELD
}
```

**Other Service Examples:**
- `chat-service` → `["messaging", "realtime"]`
- `api-gateway` → `["gateway", "routing"]`
- `security-monitor` → `["security", "monitoring"]`

---

##### **STEP 19: Field Cleanup**
```ruby
mutate {
  remove_field => [ 
    "message",           # ← Raw log line (no longer needed)
    "host",              # ← Host metadata from Filebeat  
    "agent",             # ← Agent info from Filebeat
    "ecs",               # ← ECS version info
    "extracted_service", # ← Temporary extraction field
    "log_service",       # ← Temporary service field
    "clientip",          # ← Nginx-specific (if present)
    "verb",              # ← Nginx-specific (if present)
    "request",           # ← Nginx-specific (if present) 
    "httpversion",       # ← Nginx-specific (if present)
    "response",          # ← Nginx-specific (if present)
    "bytes",             # ← Nginx-specific (if present)
    "referrer",          # ← Nginx-specific (if present)
    "auth"               # ← Nginx-specific (if present)
  ]
}
```

**Before Cleanup - Event Size:** ~2KB with all metadata
**After Cleanup - Event Size:** ~800 bytes with only relevant fields

**Fields Removed and Why:**
1. **`message`:** Raw JSON string - parsed data is now in structured fields
2. **`host`:** Filebeat host metadata - not needed for application analysis  
3. **`agent`:** Filebeat version info - not relevant for log analysis
4. **`ecs`:** Elastic Common Schema version - metadata only
5. **`extracted_service`:** Temporary field used for processing logic
6. **`log_service`:** Fallback service name - final `service_name` is used

**Fields Kept:**
- All extracted application fields (`user_id`, `request_id`, etc.)
- Processed timestamps and levels  
- Service identification (`service_name`, `logtype`)
- Environment context (`env`, `dc`)
- File tracking (`log.file.path` - kept for debugging)

---

##### **STEP 20: Index Name Generation**
```ruby
if [logtype] {
  if [logtype] == "security-events" {
    mutate {
      add_field => { "[@metadata][index_name]" => "ft-transcendence-security-%{+YYYY.MM.dd}" }
    }
  } else if [logtype] == "chat-messages" {
    mutate {
      add_field => { "[@metadata][index_name]" => "ft-transcendence-chat-%{+YYYY.MM.dd}" }
    }
  } else if [logtype] == "game-events" {
    mutate {
      add_field => { "[@metadata][index_name]" => "ft-transcendence-game-%{+YYYY.MM.dd}" }
    }
  } else if [logtype] == "api-gateway" {
    mutate {
      add_field => { "[@metadata][index_name]" => "ft-transcendence-gateway-%{+YYYY.MM.dd}" }
    }
  } else {
    mutate {
      add_field => { "[@metadata][index_name]" => "ft-transcendence-%{logtype}-%{+YYYY.MM.dd}" }
    }
  }
} else if [service_name] {
  mutate {
    add_field => { "[@metadata][index_name]" => "ft-transcendence-%{service_name}-%{+YYYY.MM.dd}" }
  }
} else {
  mutate {
    add_field => { "[@metadata][index_name]" => "ft-transcendence-logs-%{+YYYY.MM.dd}" }
  }
}
```

**Index Name Resolution Logic:**

**Input:** `"logtype": "user-service"`

**Condition Check:**
1. `[logtype] == "security-events"` → FALSE
2. `[logtype] == "chat-messages"` → FALSE  
3. `[logtype] == "game-events"` → FALSE
4. `[logtype] == "api-gateway"` → FALSE
5. **`else` branch** → TRUE

**Date Format Processing:**
- `%{+YYYY.MM.dd}` → Current date: `2023.12.25`
- Pattern: `ft-transcendence-%{logtype}-%{+YYYY.MM.dd}`
- Result: `ft-transcendence-user-service-2023.12.25`

**Final Metadata:**
```json
{
  "[@metadata]": {
    "received_at": "2023-12-25T14:30:15.123Z",
    "index_name": "ft-transcendence-user-service-2023.12.25"
  }
}
```

**Index Strategy Benefits:**
- **Daily Rotation:** New index each day for better performance
- **Service Separation:** Different services get separate indices
- **Searchable Naming:** Clear index names for Kibana index patterns

---

#### **Final Event State After All Filters**

**Complete Processed Event (sent to Elasticsearch):**
```json
{
  "@timestamp": "2023-12-25T14:30:15.123Z",        // ← From original log timestamp
  "logtype": "user-service",                       // ← From Filebeat config
  "service": "user-service",                       // ← From Filebeat config  
  "environment": "development",                    // ← From Filebeat config
  "service_group": "ft-transcendence",            // ← From Filebeat config
  "datacenter": "local",                          // ← From Filebeat config
  "service_name": "user-service",                 // ← From file path extraction
  "log_level": "INFO",                            // ← From JSON parsing + normalization
  "log_message": "User john_doe logged in successfully", // ← From JSON parsing
  "request_id": "req_a1b2c3d4e5f6",               // ← From JSON parsing
  "user_id": "user_0042",                         // ← From JSON parsing
  "username": "john_doe",                         // ← From JSON parsing  
  "session_id": "550e8400-e29b-41d4-a716-446655440000", // ← From JSON parsing
  "action": "login",                              // ← From JSON parsing
  "success": "true",                              // ← From JSON parsing (string)
  "response_time": 1.234,                         // ← From JSON parsing + type conversion
  "database_queries": 3,                          // ← From JSON parsing (kept as-is)
  "cache_hits": 1,                               // ← From JSON parsing (kept as-is)
  "env": "development",                           // ← Derived from environment
  "dc": "local",                                  // ← Derived from datacenter
  "tags": ["user-management"],                    // ← From service-specific tagging
  "log": {                                        // ← Kept from Filebeat
    "file": {
      "path": "/var/log/ft-transcendence/user-service/user.log",
      "offset": 1024
    }
  }
}
```

**Metadata (not stored, used for routing):**
```json
{
  "[@metadata]": {
    "received_at": "2023-12-25T14:30:15.123Z",
    "index_name": "ft-transcendence-user-service-2023.12.25"
  }
}
```

---

#### **Fields Removed During Processing:**

1. **From Original Filebeat Event:**
```json
{
  "message": "{"timestamp":"2023-12-25T14:30:15.123Z",...}",  // ← REMOVED: Raw JSON string
  "host": {                                                   // ← REMOVED: Host metadata
    "name": "filebeat-container",
    "architecture": "x86_64",
    "os": {...}
  },
  "agent": {                                                  // ← REMOVED: Agent info
    "name": "filebeat-container", 
    "type": "filebeat",
    "version": "8.15.0"
  },
  "ecs": {                                                    // ← REMOVED: ECS version
    "version": "8.15.0"
  }
}
```

2. **Temporary Processing Fields:**
```json
{
  "extracted_service": "user-service",    // ← REMOVED: Temporary extraction
  "log_service": "user-service",          // ← REMOVED: Fallback service name
  "parsed_json": {...}                    // ← REMOVED: Parsed JSON object
}
```

**Space Savings:** ~60% reduction in event size (from ~2KB to ~800 bytes)

---

#### **Output Section - Elasticsearch Delivery**
```ruby
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

**Connection Details:**
- **Protocol:** HTTPS with SSL verification disabled
- **Authentication:** Basic auth using environment variables
- **Index:** Dynamic based on metadata (`ft-transcendence-user-service-2023.12.25`)

**Delivery Process:**
1. **SSL Handshake:** Connect to Elasticsearch with TLS
2. **Authentication:** Login with elastic user credentials
3. **Index Creation:** Auto-create index if it doesn't exist
4. **Document Indexing:** Insert processed event as JSON document
5. **Response:** Elasticsearch returns success/failure status

---

#### **Error Handling Throughout Pipeline**

##### **Grok Parse Failures:**
```ruby
tag_on_failure => ["_grokparsefailure_service_extraction"]
```
**If file path doesn't match patterns:**
- Event gets tagged with failure tag
- Processing continues with fallback service name
- Event is still indexed (not dropped)

##### **JSON Parse Failures:**
```ruby
skip_on_invalid_json => true
```
**If message isn't valid JSON:**
- No `parsed_json` field created  
- All JSON field extractions are skipped
- Event processed as plain text log
- Alternative Grok patterns may apply (for Nginx logs)

##### **Field Missing Scenarios:**
```ruby
if [parsed_json][timestamp] {
  mutate { add_field => { "log_timestamp" => "%{[parsed_json][timestamp]}" } }
}
```
**If specific JSON fields are missing:**
- Individual field extractions are skipped
- No errors thrown
- Other available fields are still processed

##### **Date Parse Failures:**
```ruby
date {
  match => [ "log_timestamp", "ISO8601", "yyyy-MM-dd HH:mm:ss,SSS" ]
  target => "@timestamp"
}
```
**If timestamp format doesn't match:**
- Original `@timestamp` from Filebeat is kept
- Processing continues normally
- May add `_dateparsefailure` tag automatically

---

#### **Performance Characteristics**

##### **Memory Usage:**
- **Input Buffer:** Stores events from Filebeat
- **Filter Processing:** Each mutate/grok creates temporary objects
- **Output Buffer:** Queues events for Elasticsearch delivery

##### **Processing Speed:**
- **JSON Parsing:** Fast (native JSON parser)
- **Grok Patterns:** Moderate (regex matching)
- **Field Operations:** Very fast (simple string operations)
- **Throughput:** ~1000-5000 events/second per worker

##### **Bottlenecks:**
1. **Complex Grok Patterns:** Can slow processing
2. **Many Conditional Checks:** CPU intensive
3. **Elasticsearch Connection:** Network I/O bound
4. **SSL Verification:** Additional crypto overhead

---

#### **Alternative Processing Paths**

##### **For Different Log Types:**

**Nginx Access Logs:**
```ruby
if [logtype] == "api-gateway" {
  grok {
    match => { "message" => "%{COMBINEDAPACHELOG}" }
  }
  # Different field extractions...
}
```

**System Logs:**
```ruby
if [logtype] == "system" {
  grok {
    match => { "message" => "%{SYSLOGLINE}" }
  }
  # System-specific processing...
}
```

**Container Logs:**
```ruby
if [input][type] == "container" {
  # Docker-specific metadata processing
}
```

##### **Service-Specific Processing:**

**Chat Service Logs:**
```ruby
if [service_name] == "chat-service" {
  # Extract message_id, channel_id, room_id
  # Add realtime messaging tags
}
```

**Game Service Logs:**
```ruby  
if [service_name] == "game-service" {
  # Extract game_id, match_id, tournament_id
  # Add gaming-specific metrics
}
```

#### Output Section
```ruby
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

**Final Processed Event Sent to Elasticsearch:**
```json
{
  "@timestamp": "2023-12-25T14:30:15.123Z",
  "service_name": "user-service",
  "logtype": "user-service",
  "environment": "development",
  "service_group": "ft-transcendence",
  "datacenter": "local",
  "log_level": "INFO",
  "log_message": "User john_doe logged in successfully",
  "request_id": "req_a1b2c3d4e5f6",
  "user_id": "user_0042",
  "username": "john_doe",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "login",
  "success": "true",
  "response_time": 1.234,
  "database_queries": 3,
  "cache_hits": 1,
  "tags": ["user-management"]
}
```

---

## Step 4: Elasticsearch Storage

### Elasticsearch Configuration (`elasticsearch.yml`)

#### Index Creation
```yaml
action.auto_create_index: "+ft-transcendence-*,+microservices-logs-*,+game-events-*,+chat-messages-*,+security-events-*"
```
**Result**: Automatically creates indices matching the patterns

#### Index Structure
**Index Name**: `ft-transcendence-user-service-2023.12.25`

**Mapping (Auto-generated)**:
```json
{
  "mappings": {
    "properties": {
      "@timestamp": {"type": "date"},
      "service_name": {"type": "keyword"},
      "log_level": {"type": "keyword"},
      "log_message": {"type": "text"},
      "user_id": {"type": "keyword"},
      "username": {"type": "keyword"},
      "request_id": {"type": "keyword"},
      "session_id": {"type": "keyword"},
      "action": {"type": "keyword"},
      "success": {"type": "keyword"},
      "response_time": {"type": "float"},
      "response_status": {"type": "integer"},
      "request_ip": {"type": "ip"},
      "tags": {"type": "keyword"}
    }
  }
}
```

---

## Step 5: Kibana Visualization

### Kibana Configuration (`kibana.yml`)

#### Connection to Elasticsearch
```yaml
elasticsearch.hosts: [ "${ELASTICSEARCH_HOST_PORT}" ]
elasticsearch.serviceAccountToken: "${KIBANA_SERVICE_ACCOUNT_TOKEN}"
```

#### Index Pattern Creation
**Pattern**: `ft-transcendence-*`
**Time Field**: `@timestamp`

### Available Fields in Kibana

#### Searchable Fields:
- **Service Information**: `service_name`, `logtype`, `environment`
- **User Context**: `user_id`, `username`, `session_id`
- **Request Context**: `request_id`, `request_method`, `request_url`, `request_ip`
- **Response Metrics**: `response_status`, `response_time`, `response_duration`
- **Log Context**: `log_level`, `log_message`, `action`
- **Error Information**: `error_code`, `error_message`, `error_reason`
- **Performance**: `database_queries`, `cache_hits`

#### Visualizations Available:
1. **Service Performance Dashboard**
   - Response time trends
   - Error rate by service
   - Request volume over time

2. **User Activity Monitoring**
   - Login/logout patterns
   - User action distribution
   - Session duration analysis

3. **Error Analysis**
   - Error frequency by type
   - Failed authentication attempts
   - System error trends

---

## Data Flow Summary

### What Gets Added at Each Stage:

1. **Log Generation**: Raw JSON logs with application context
2. **Filebeat**: Host metadata, Docker info, log file path
3. **Logstash**: Parsed fields, data type conversion, service tagging, index routing
4. **Elasticsearch**: Document storage with optimized mappings
5. **Kibana**: Search interface and visualization capabilities

### What Gets Filtered/Ignored:

1. **Filebeat**: Empty log lines, unnecessary agent fields
2. **Logstash**: Original message field, temporary processing fields, host metadata
3. **Elasticsearch**: Documents older than retention policy
4. **Kibana**: Fields not selected in index patterns

### Performance Considerations:

- **Filebeat**: Bulk size 512, compression level 3
- **Logstash**: Memory queue, single worker
- **Elasticsearch**: Daily indices for better performance
- **Kibana**: Field-specific queries for faster results

This pipeline provides comprehensive log processing with proper field extraction, data typing, and efficient storage for analysis in Kibana.
