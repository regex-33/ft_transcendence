# Notification Service Log Generator

This Python script generates realistic notification service logs for the ft-transcendence project, designed to work with your ELK stack configuration.

## Features

- **Realistic Log Generation**: Creates authentic notification service logs with proper JSON formatting
- **Multiple Log Types**: Generates various notification scenarios (sent, queued, batch processing, webhooks, etc.)
- **Error Simulation**: Includes realistic error conditions and failure scenarios
- **ELK Stack Compatible**: Logs are formatted to work with your Logstash pipeline and Elasticsearch mappings
- **Configurable**: Easy to customize users, notification types, and log patterns

## Log Types Generated

### Normal Logs (`notification.log`)
- Notification sent successfully
- Notification queued for processing
- Template processing logs
- Batch processing logs
- Webhook delivery logs
- Warning logs (performance issues, etc.)

### Error Logs (`notification-error.log`)
- Delivery failures
- Invalid tokens
- Rate limit exceeded
- Template not found
- Validation errors
- External service errors
- Network timeouts
- Authentication failures

## Directory Structure

```
/var/log/ft-transcendence/notification-service/
├── notification.log         # Normal operational logs
└── notification-error.log   # Error logs
```

## Installation & Setup

### 1. Save the Python Script
Save the Python code as `notification_log_generator.py`

### 2. Save the Runner Script
Save the bash script as `notification-log-runner.sh` and make it executable:
```bash
chmod +x notification-log-runner.sh
```

### 3. Setup the Environment
```bash
# Setup directories and files
./notification-log-runner.sh setup

# Start the log generator
./notification-log-runner.sh start
```

## Usage

### Basic Commands
```bash
# Start the generator
./notification-log-runner.sh start

# Check status
./notification-log-runner.sh status

# Stop the generator
./notification-log-runner.sh stop

# Restart the generator
./notification-log-runner.sh restart

# View live logs
./notification-log-runner.sh tail

# Show sample logs
./notification-log-runner.sh sample

# Clean up old logs
./notification-log-runner.sh clean
```

### Custom Log Directory
```bash
# Use custom directory
LOG_DIR=/tmp/custom-logs ./notification-log-runner.sh start
```

### Direct Python Usage
```bash
# Run with default directory
python3 notification_log_generator.py

# Run with custom directory
LOG_DIR=/tmp/custom-logs python3 notification_log_generator.py
```

## Sample Log Outputs

### Notification Sent Log
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "notification-service",
  "message": "Notification sent successfully via push",
  "request_id": "req_abc123def456",
  "user_id": "user_001",
  "username": "player1",
  "session_id": "sess_xyz789uvw012",
  "action": "send_notification",
