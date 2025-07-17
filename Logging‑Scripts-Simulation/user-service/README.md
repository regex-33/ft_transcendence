# User Service Log Generator

This Python script generates realistic user service logs that match your ELK stack configuration for the ft-transcendence project.

## Features

- **Three log types**: user.log, user-access.log, user-error.log
- **JSON formatted logs** that match your Logstash pipeline expectations
- **Realistic data**: usernames, actions, HTTP requests, error scenarios
- **Configurable**: sample generation or continuous streaming
- **Thread-safe**: multiple log types generated simultaneously

## Usage

### Basic Usage (Generate 20 sample logs)
```bash
python user_service_log_generator.py
```

### Generate specific number of sample logs
```bash
python user_service_log_generator.py --sample 50
```

### Continuous log generation
```bash
python user_service_log_generator.py --continuous
```

### Custom log directory
```bash
python user_service_log_generator.py --log-dir /custom/path/user-service --sample 10
```

## Generated Log Structure

### 1. user.log
General user service operations and business logic:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "user-service",
  "request_id": "req_abc123def456",
  "user_id": "user_0042",
  "username": "john_doe",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "login",
  "success": true,
  "message": "User john_doe logged in successfully",
  "login_method": "password",
  "response_time": 0.234,
  "database_queries": 2,
  "cache_hits": 1
}
```

### 2. user-access.log
HTTP access logs for user service endpoints:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "user-service",
  "request_id": "req_def789ghi012",
  "user_id": "user_0042",
  "username": "john_doe",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "request": {
    "method": "POST",
    "url": "/api/v1/users/login",
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "size": 1234,
    "content_type": "application/json"
  },
  "response": {
    "status": 200,
    "time": 0.456,
    "duration": 456.78,
    "size": 2048
  },
  "message": "POST /api/v1/users/login - 200"
}
```

### 3. user-error.log
Error and warning logs:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "ERROR",
  "service": "user-service",
  "request_id": "req_ghi345jkl678",
  "user_id": "user_0042",
  "username": "john_doe",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "error_code": "authentication_failed",
  "success": false,
  "error": "Authentication credentials are invalid",
  "message": "Error in user service: Authentication credentials are invalid",
  "request": {
    "method": "POST",
    "url": "/api/v1/users/login",
    "ip": "192.168.1.100"
  },
  "stack_trace": [
    "com.fttranscendence.user.service.UserService.processRequest(UserService.java:145)",
    "com.fttranscendence.user.controller.UserController.handleRequest(UserController.java:89)",
    "com.fttranscendence.common.handler.RequestHandler.process(RequestHandler.java:234)"
  ]
}
```

## Log Generation Patterns

### User Actions
- login, logout, register, profile_update, password_change
- email_verification, avatar_upload, settings_update
- friend_request, friend_accept, friend_remove
- privacy_settings, notification_settings

### HTTP Endpoints
- /api/v1/users/login, /api/v1/users/logout
- /api/v1/users/register, /api/v1/users/profile
- /api/v1/users/password, /api/v1/users/avatar
- /api/v1/users/settings, /api/v1/users/friends

### Error Types
- validation_error, authentication_failed, authorization_denied
- user_not_found, email_already_exists, username_taken
- invalid_password, session_expired, rate_limit_exceeded
- database_error, network_timeout, service_unavailable

## Integration with ELK Stack

The generated logs are designed to work seamlessly with your ELK configuration:

1. **Filebeat** will collect these logs based on your filebeat.yml configuration
2. **Logstash** will parse the JSON and extract fields according to your pipeline
3. **Elasticsearch** will index them using your template mappings
4. **Kibana** will display them with proper field mappings

## Directory Structure Created

```
/var/log/ft-transcendence/user-service/
├── user.log           # General user service operations
├── user-access.log    # HTTP access logs
└── user-error.log     # Error and warning logs
```

## Log Frequency

When running continuously:
- **user.log**: ~2 seconds interval
- **user-access.log**: ~1 second interval  
- **user-error.log**: ~8 seconds interval

These intervals include random variations to simulate realistic traffic patterns.

## Requirements

- Python 3.6+
- No external dependencies (uses only standard library)
- Write permissions to log directory

## Security Note

The generated logs contain only simulated data and do not expose any real user information or security credentials.
