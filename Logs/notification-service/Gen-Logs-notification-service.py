#!/usr/bin/env python3
"""
Notification Service Log Generator for ft-transcendence
Generates realistic logs that match the ELK stack configuration
"""

import json
import random
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import threading
import os
import signal
import sys

class NotificationLogGenerator:
    def __init__(self, log_dir: str = "/var/log/ft-transcendence/notification-service"):
        self.log_dir = log_dir
        self.running = False
        
        # Ensure log directory exists
        os.makedirs(log_dir, exist_ok=True)
        
        # Log file paths
        self.notification_log_path = os.path.join(log_dir, "notification.log")
        self.error_log_path = os.path.join(log_dir, "notification-error.log")
        
        # Sample data for realistic logs
        self.notification_types = [
            "game_invitation", "tournament_start", "tournament_end",
            "friend_request", "friend_accepted", "message_received",
            "game_result", "achievement_unlocked", "system_announcement",
            "maintenance_notice", "password_reset", "account_verification"
        ]
        
        self.users = [
            {"id": "user_001", "username": "player1"},
            {"id": "user_002", "username": "gamer_pro"},
            {"id": "user_003", "username": "pong_master"},
            {"id": "user_004", "username": "tournament_king"},
            {"id": "user_005", "username": "chat_enthusiast"},
            {"id": "user_006", "username": "rookie_player"},
            {"id": "user_007", "username": "elite_gamer"},
            {"id": "user_008", "username": "casual_player"}
        ]
        
        self.channels = ["email", "push", "in_app", "sms", "websocket"]
        self.error_types = [
            "DELIVERY_FAILED", "INVALID_TOKEN", "RATE_LIMIT_EXCEEDED",
            "TEMPLATE_NOT_FOUND", "VALIDATION_ERROR", "EXTERNAL_SERVICE_ERROR",
            "NETWORK_TIMEOUT", "AUTHENTICATION_FAILED", "QUOTA_EXCEEDED"
        ]
        
        self.request_contexts = [
            "game_lobby", "tournament_bracket", "user_profile",
            "chat_room", "leaderboard", "settings", "admin_panel"
        ]

    def generate_request_id(self) -> str:
        """Generate a realistic request ID"""
        return f"req_{uuid.uuid4().hex[:12]}"

    def generate_notification_id(self) -> str:
        """Generate a realistic notification ID"""
        return f"notif_{uuid.uuid4().hex[:16]}"

    def generate_session_id(self) -> str:
        """Generate a realistic session ID"""
        return f"sess_{uuid.uuid4().hex[:20]}"

    def get_random_user(self) -> Dict[str, str]:
        """Get a random user"""
        return random.choice(self.users)

    def get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.utcnow().isoformat() + "Z"

    def generate_notification_sent_log(self) -> Dict:
        """Generate a notification sent log entry"""
        user = self.get_random_user()
        notification_type = random.choice(self.notification_types)
        channel = random.choice(self.channels)
        
        log_entry = {
            "timestamp": self.get_timestamp(),
            "level": "INFO",
            "service": "notification-service",
            "message": f"Notification sent successfully via {channel}",
            "request_id": self.generate_request_id(),
            "user_id": user["id"],
            "username": user["username"],
            "session_id": self.generate_session_id(),
            "action": "send_notification",
            "success": True,
            "notification": {
                "id": self.generate_notification_id(),
                "type": notification_type,
                "channel": channel,
                "priority": random.choice(["low", "medium", "high", "urgent"]),
                "template": f"{notification_type}_template",
                "delivery_time": round(random.uniform(50, 500), 2)
            },
            "recipient": {
                "user_id": user["id"],
                "username": user["username"],
                "channel_token": f"token_{uuid.uuid4().hex[:16]}",
                "preferences": {
                    "enabled": True,
                    "quiet_hours": random.choice([True, False])
                }
            },
            "context": {
                "source": random.choice(self.request_contexts),
                "triggered_by": random.choice(["user_action", "system_event", "scheduled_task"]),
                "metadata": {
                    "game_id": f"game_{random.randint(1000, 9999)}" if notification_type.startswith("game") else None,
                    "tournament_id": f"tournament_{random.randint(100, 999)}" if notification_type.startswith("tournament") else None
                }
            }
        }
        
        return log_entry

    def generate_notification_queued_log(self) -> Dict:
        """Generate a notification queued log entry"""
        user = self.get_random_user()
        notification_type = random.choice(self.notification_types)
        
        log_entry = {
            "timestamp": self.get_timestamp(),
            "level": "INFO",
            "service": "notification-service",
            "message": "Notification queued for processing",
            "request_id": self.generate_request_id(),
            "user_id": user["id"],
            "username": user["username"],
            "action": "queue_notification",
            "success": True,
            "notification": {
                "id": self.generate_notification_id(),
                "type": notification_type,
                "status": "queued",
                "priority": random.choice(["low", "medium", "high"]),
                "scheduled_at": self.get_timestamp(),
                "retry_count": 0,
                "max_retries": 3
            },
            "queue": {
                "name": f"{notification_type}_queue",
                "size": random.randint(1, 50),
                "processing_time_estimate": random.randint(1, 30)
            }
        }
        
        return log_entry

    def generate_batch_processing_log(self) -> Dict:
        """Generate a batch processing log entry"""
        batch_size = random.randint(10, 100)
        processed = random.randint(int(batch_size * 0.8), batch_size)
        
        log_entry = {
            "timestamp": self.get_timestamp(),
            "level": "INFO",
            "service": "notification-service",
            "message": f"Batch processing completed: {processed}/{batch_size} notifications processed",
            "request_id": self.generate_request_id(),
            "action": "batch_process",
            "success": True,
            "batch": {
                "id": f"batch_{uuid.uuid4().hex[:12]}",
                "size": batch_size,
                "processed": processed,
                "failed": batch_size - processed,
                "processing_time": round(random.uniform(1.5, 10.0), 2),
                "channels": random.sample(self.channels, random.randint(1, 3))
            },
            "performance": {
                "throughput": round(processed / random.uniform(1.5, 10.0), 2),
                "success_rate": round((processed / batch_size) * 100, 2)
            }
        }
        
        return log_entry

    def generate_template_processing_log(self) -> Dict:
        """Generate a template processing log entry"""
        user = self.get_random_user()
        notification_type = random.choice(self.notification_types)
        
        log_entry = {
            "timestamp": self.get_timestamp(),
            "level": "DEBUG",
            "service": "notification-service",
            "message": f"Template processed for {notification_type}",
            "request_id": self.generate_request_id(),
            "user_id": user["id"],
            "action": "process_template",
            "success": True,
            "template": {
                "name": f"{notification_type}_template",
                "version": f"v{random.randint(1, 5)}.{random.randint(0, 9)}",
                "language": random.choice(["en", "fr", "es", "de"]),
                "variables_count": random.randint(3, 12),
                "processing_time": round(random.uniform(10, 100), 2)
            },
            "variables": {
                "username": user["username"],
                "action_url": f"https://ft-transcendence.com/action/{uuid.uuid4().hex[:8]}",
                "expiry_time": (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z"
            }
        }
        
        return log_entry

    def generate_webhook_log(self) -> Dict:
        """Generate a webhook delivery log entry"""
        user = self.get_random_user()
        
        log_entry = {
            "timestamp": self.get_timestamp(),
            "level": "INFO",
            "service": "notification-service",
            "message": "Webhook notification delivered",
            "request_id": self.generate_request_id(),
            "user_id": user["id"],
            "action": "webhook_delivery",
            "success": True,
            "webhook": {
                "url": f"https://external-service.com/webhook/{uuid.uuid4().hex[:12]}",
                "method": "POST",
                "response_status": 200,
                "response_time": round(random.uniform(100, 1000), 2),
                "retry_count": 0,
                "payload_size": random.randint(200, 2000)
            },
            "external_service": {
                "name": random.choice(["Discord", "Slack", "Teams", "Custom"]),
                "rate_limit_remaining": random.randint(50, 1000)
            }
        }
        
        return log_entry

    def generate_error_log(self) -> Dict:
        """Generate an error log entry"""
        user = self.get_random_user()
        error_type = random.choice(self.error_types)
        channel = random.choice(self.channels)
        
        error_messages = {
            "DELIVERY_FAILED": f"Failed to deliver notification via {channel}",
            "INVALID_TOKEN": f"Invalid {channel} token for user {user['username']}",
            "RATE_LIMIT_EXCEEDED": f"Rate limit exceeded for {channel} notifications",
            "TEMPLATE_NOT_FOUND": f"Template not found for notification type",
            "VALIDATION_ERROR": "Notification payload validation failed",
            "EXTERNAL_SERVICE_ERROR": f"External {channel} service error",
            "NETWORK_TIMEOUT": f"Network timeout while connecting to {channel} service",
            "AUTHENTICATION_FAILED": f"Authentication failed for {channel} service",
            "QUOTA_EXCEEDED": f"Daily quota exceeded for {channel} notifications"
        }
        
        log_entry = {
            "timestamp": self.get_timestamp(),
            "level": "ERROR",
            "service": "notification-service",
            "message": error_messages.get(error_type, "Unknown error occurred"),
            "request_id": self.generate_request_id(),
            "user_id": user["id"],
            "username": user["username"],
            "session_id": self.generate_session_id(),
            "action": "send_notification",
            "success": False,
            "error": error_messages.get(error_type, "Unknown error occurred"),
            "error_code": error_type,
            "error_reason": error_type.lower().replace("_", " "),
            "notification": {
                "id": self.generate_notification_id(),
                "type": random.choice(self.notification_types),
                "channel": channel,
                "retry_count": random.randint(1, 3),
                "max_retries": 3,
                "will_retry": random.choice([True, False])
            },
            "context": {
                "source": random.choice(self.request_contexts),
                "user_agent": random.choice([
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                    "ft-transcendence-mobile/1.0.0"
                ]),
                "ip_address": f"{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"
            }
        }
        
        return log_entry

    def generate_warning_log(self) -> Dict:
        """Generate a warning log entry"""
        user = self.get_random_user()
        
        warnings = [
            "High notification volume detected",
            "Template rendering took longer than expected",
            "External service response slow",
            "User preferences not found, using defaults",
            "Notification channel partially unavailable",
            "Queue processing behind schedule"
        ]
        
        log_entry = {
            "timestamp": self.get_timestamp(),
            "level": "WARN",
            "service": "notification-service",
            "message": random.choice(warnings),
            "request_id": self.generate_request_id(),
            "user_id": user["id"],
            "action": "performance_monitoring",
            "success": True,
            "metrics": {
                "queue_size": random.randint(100, 1000),
                "processing_time": round(random.uniform(5, 30), 2),
                "success_rate": round(random.uniform(85, 95), 2),
                "error_rate": round(random.uniform(5, 15), 2)
            },
            "thresholds": {
                "max_queue_size": 500,
                "max_processing_time": 10.0,
                "min_success_rate": 90.0
            }
        }
        
        return log_entry

    def write_log(self, log_entry: Dict, log_file: str):
        """Write log entry to file"""
        try:
            with open(log_file, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
                f.flush()
        except Exception as e:
            print(f"Error writing to {log_file}: {e}")

    def generate_logs(self):
        """Main log generation loop"""
        print(f"Starting notification service log generation...")
        print(f"Log directory: {self.log_dir}")
        print(f"Normal logs: {self.notification_log_path}")
        print(f"Error logs: {self.error_log_path}")
        print("Press Ctrl+C to stop")
        
        while self.running:
            try:
                # Generate different types of logs with different probabilities
                rand = random.random()
                
                if rand < 0.3:  # 30% - notification sent
                    log_entry = self.generate_notification_sent_log()
                    self.write_log(log_entry, self.notification_log_path)
                    
                elif rand < 0.5:  # 20% - notification queued
                    log_entry = self.generate_notification_queued_log()
                    self.write_log(log_entry, self.notification_log_path)
                    
                elif rand < 0.65:  # 15% - template processing
                    log_entry = self.generate_template_processing_log()
                    self.write_log(log_entry, self.notification_log_path)
                    
                elif rand < 0.75:  # 10% - batch processing
                    log_entry = self.generate_batch_processing_log()
                    self.write_log(log_entry, self.notification_log_path)
                    
                elif rand < 0.85:  # 10% - webhook delivery
                    log_entry = self.generate_webhook_log()
                    self.write_log(log_entry, self.notification_log_path)
                    
                elif rand < 0.92:  # 7% - warnings
                    log_entry = self.generate_warning_log()
                    self.write_log(log_entry, self.notification_log_path)
                    
                else:  # 8% - errors
                    log_entry = self.generate_error_log()
                    self.write_log(log_entry, self.error_log_path)
                
                # Random delay between log entries (0.5 to 5 seconds)
                time.sleep(random.uniform(0.5, 5.0))
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error generating logs: {e}")
                time.sleep(1)

    def start(self):
        """Start log generation"""
        self.running = True
        self.generate_logs()

    def stop(self):
        """Stop log generation"""
        self.running = False

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    print("\nShutting down log generator...")
    sys.exit(0)

def main():
    """Main function"""
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create log generator
    log_dir = "/var/log/ft-transcendence/notification-service"
    
    # Allow custom log directory via environment variable
    if "LOG_DIR" in os.environ:
        log_dir = os.path.join(os.environ["LOG_DIR"], "notification-service")
    
    generator = NotificationLogGenerator(log_dir)
    
    try:
        generator.start()
    except KeyboardInterrupt:
        print("\nStopping log generator...")
    finally:
        generator.stop()

if __name__ == "__main__":
    main()
