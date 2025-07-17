
```json
{
  "sample_log_formats": {
    "auth.log": {
      "description": "General authentication service logs",
      "example": {
        "timestamp": "2024-01-15T10:30:45.123Z",
        "service": "auth-service",
        "request_id": "req-1234567890abcdef",
        "session_id": "sess-abcd1234",
        "level": "INFO",
        "action": "login",
        "user_id": "1234",
        "username": "player1",
        "success": true,
        "message": "User login successful",
        "request": {
          "method": "POST",
          "url": "/api/auth/login",
          "ip": "192.168.1.100",
          "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        "response": {
          "status": 200,
          "duration": 0.543
        }
      }
    },
    "auth-access.log": {
      "description": "Successful authentication access logs",
      "example": {
        "timestamp": "2024-01-15T10:30:45.123Z",
        "service": "auth-service",
        "request_id": "req-1234567890abcdef",
        "session_id": "sess-abcd1234",
        "level": "INFO",
        "action": "token_refresh",
        "user_id": "1234",
        "username": "player1",
        "success": true,
        "message": "Access granted for token_refresh",
        "request": {
          "method": "POST",
          "url": "/api/auth/token_refresh",
          "ip": "192.168.1.100",
          "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        },
        "response": {
          "status": 200,
          "duration": 0.123
        }
      }
    },
    "auth-error.log": {
      "description": "Authentication error logs",
      "example": {
        "timestamp": "2024-01-15T10:30:45.123Z",
        "service": "auth-service",
        "request_id": "req-1234567890abcdef",
        "session_id": "sess-abcd1234",
        "level": "ERROR",
        "action": "login",
        "user_id": "1234",
        "username": "player1",
        "success": false,
        "message": "Error during login",
        "error": "Invalid credentials provided",
        "error_code": "AUTH_001",
        "error_reason": "login_error",
        "request": {
          "method": "POST",
          "url": "/api/auth/login",
          "ip": "192.168.1.100",
          "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
        },
        "response": {
          "status": 401,
          "duration": 0.234
        }
      }
    },
    "auth-security.log": {
      "description": "Authentication security events",
      "example": {
        "timestamp": "2024-01-15T10:30:45.123Z",
        "service": "auth-service",
        "request_id": "req-1234567890abcdef",
        "session_id": "sess-abcd1234",
        "level": "WARN",
        "security_event": "failed_login_attempt",
        "user_id": "1234",
        "username": "player1",
        "threat_level": "medium",
        "source_ip": "192.168.1.100",
        "message": "Security event: failed_login_attempt",
        "action": "security_check",
        "success": false,
        "request": {
          "method": "POST",
          "url": "/api/auth/login",
          "ip": "192.168.1.100",
          "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)"
        },
        "response": {
          "status": 401,
          "duration": 0.345
        }
      }
    },
    "security-events.log": {
      "description": "Security monitoring and alerts",
      "example": {
        "timestamp": "2024-01-15T10:30:45.123Z",
        "service": "auth-service",
        "request_id": "req-1234567890abcdef",
        "session_id": "sess-abcd1234",
        "level": "ERROR",
        "security_event": "brute_force_detected",
        "threat_level": "high",
        "source_ip": "192.168.1.100",
        "user_id": "1234",
        "username": "player1",
        "message": "Security alert: brute_force_detected detected",
        "action": "security_monitor",
        "success": false,
        "event_type": "security_alert",
        "request": {
          "method": "POST",
          "url": "/api/auth/login",
          "ip": "192.168.1.100",
          "user_agent": "Mozilla/5.0 (Android 11; Mobile; rv:89.0) Gecko/89.0"
        },
        "metadata": {
          "attempts": 5,
          "time_window": "5m",
          "blocked": true
        }
      }
    }
  },
```
```bash
# Make the setup script executable and run it
chmod +x setup_auth_logs.sh
./setup_auth_logs.sh

# Generate logs continuously (default mode)
python3 auth_log_generator.py --mode continuous

# Generate historical logs for testing
python3 auth_log_generator.py --mode historical --days 7 --entries-per-day 1000

# Generate a burst of logs
python3 auth_log_generator.py --mode burst --burst-count 100
```
