#!/usr/bin/env python3
"""
User Service Log Generator for ft-transcendence
Generates realistic logs that match the ELK stack configuration
"""

import json
import random
import time
import os
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uuid
import logging
from pathlib import Path

class UserServiceLogGenerator:
    def __init__(self, log_dir: str = "/var/log/ft-transcendence/user-service"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Log file paths
        self.user_log_path = self.log_dir / "user.log"
        self.user_access_log_path = self.log_dir / "user-access.log"
        self.user_error_log_path = self.log_dir / "user-error.log"
        
        # Sample data for realistic logs
        self.usernames = [
            "john_doe", "jane_smith", "mike_wilson", "sarah_jones", "alex_chen",
            "emma_davis", "david_brown", "lisa_taylor", "ryan_miller", "amy_garcia",
            "chris_anderson", "jessica_martin", "kevin_white", "amanda_thomas",
            "brian_jackson", "michelle_harris", "steven_clark", "rachel_lewis",
            "daniel_robinson", "jennifer_walker", "matthew_hall", "ashley_allen",
            "joshua_young", "stephanie_wright", "andrew_king", "melissa_scott",
            "james_green", "nicole_adams", "robert_baker", "kimberly_gonzalez"
        ]
        
        self.user_ids = [f"user_{i:04d}" for i in range(1, 101)]
        self.session_ids = [str(uuid.uuid4()) for _ in range(50)]
        
        self.user_actions = [
            "login", "logout", "register", "profile_update", "password_change",
            "email_verification", "profile_view", "avatar_upload", "settings_update",
            "account_deletion", "password_reset", "two_factor_enable", "two_factor_disable",
            "friend_request", "friend_accept", "friend_remove", "block_user", "unblock_user",
            "privacy_settings", "notification_settings", "language_change", "timezone_update"
        ]
        
        self.error_types = [
            "validation_error", "authentication_failed", "authorization_denied",
            "user_not_found", "email_already_exists", "username_taken",
            "invalid_password", "session_expired", "rate_limit_exceeded",
            "database_error", "network_timeout", "service_unavailable",
            "invalid_token", "expired_token", "permission_denied"
        ]
        
        self.ip_addresses = [
            "192.168.1.100", "192.168.1.101", "192.168.1.102", "10.0.0.50",
            "10.0.0.51", "172.16.0.100", "172.16.0.101", "203.0.113.1",
            "203.0.113.2", "198.51.100.1", "198.51.100.2", "127.0.0.1"
        ]
        
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        ]
        
        self.endpoints = [
            "/api/v1/users/login", "/api/v1/users/logout", "/api/v1/users/register",
            "/api/v1/users/profile", "/api/v1/users/password", "/api/v1/users/avatar",
            "/api/v1/users/settings", "/api/v1/users/friends", "/api/v1/users/search",
            "/api/v1/users/verify", "/api/v1/users/reset-password", "/api/v1/users/2fa",
            "/api/v1/users/privacy", "/api/v1/users/notifications", "/api/v1/users/preferences"
        ]
        
        # Running flag for threads
        self.running = False
        self.threads = []

    def generate_timestamp(self) -> str:
        """Generate ISO timestamp with slight randomization"""
        base_time = datetime.now()
        random_offset = random.randint(-300, 300)  # ±5 minutes
        timestamp = base_time + timedelta(seconds=random_offset)
        return timestamp.isoformat() + "Z"

    def generate_request_id(self) -> str:
        """Generate unique request ID"""
        return f"req_{uuid.uuid4().hex[:12]}"

    def generate_user_log(self) -> Dict:
        """Generate general user service log entry"""
        log_levels = ["INFO", "DEBUG", "WARN"]
        weights = [0.7, 0.2, 0.1]
        
        log_entry = {
            "timestamp": self.generate_timestamp(),
            "level": random.choices(log_levels, weights=weights)[0],
            "service": "user-service",
            "request_id": self.generate_request_id(),
            "user_id": random.choice(self.user_ids),
            "username": random.choice(self.usernames),
            "session_id": random.choice(self.session_ids),
            "action": random.choice(self.user_actions),
            "success": random.choice([True, True, True, False]),  # 75% success rate
        }
        
        # Add additional context based on action
        if log_entry["action"] == "login":
            log_entry["message"] = f"User {log_entry['username']} logged in successfully"
            log_entry["login_method"] = random.choice(["password", "oauth", "2fa"])
        elif log_entry["action"] == "register":
            log_entry["message"] = f"New user {log_entry['username']} registered"
            log_entry["registration_method"] = random.choice(["email", "oauth_google", "oauth_github"])
        elif log_entry["action"] == "profile_update":
            log_entry["message"] = f"User {log_entry['username']} updated profile"
            log_entry["updated_fields"] = random.sample(["email", "name", "bio", "location"], k=random.randint(1, 3))
        elif log_entry["action"] == "password_change":
            log_entry["message"] = f"User {log_entry['username']} changed password"
            log_entry["security_event"] = "password_change"
        else:
            log_entry["message"] = f"User {log_entry['username']} performed {log_entry['action']}"
        
        # Add performance metrics
        log_entry["response_time"] = round(random.uniform(0.1, 2.0), 3)
        log_entry["database_queries"] = random.randint(1, 5)
        log_entry["cache_hits"] = random.randint(0, 3)
        
        return log_entry

    def generate_access_log(self) -> Dict:
        """Generate user access log entry (HTTP requests)"""
        methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]
        method_weights = [0.5, 0.3, 0.1, 0.05, 0.05]
        
        status_codes = [200, 201, 204, 400, 401, 403, 404, 422, 500]
        status_weights = [0.6, 0.1, 0.05, 0.08, 0.05, 0.03, 0.04, 0.03, 0.02]
        
        log_entry = {
            "timestamp": self.generate_timestamp(),
            "level": "INFO",
            "service": "user-service",
            "request_id": self.generate_request_id(),
            "user_id": random.choice(self.user_ids),
            "username": random.choice(self.usernames),
            "session_id": random.choice(self.session_ids),
            "request": {
                "method": random.choices(methods, weights=method_weights)[0],
                "url": random.choice(self.endpoints),
                "ip": random.choice(self.ip_addresses),
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": random.choices(status_codes, weights=status_weights)[0],
                "time": round(random.uniform(0.05, 3.0), 3),
                "duration": round(random.uniform(50, 3000), 2)
            }
        }
        
        # Add request size for POST/PUT/PATCH
        if log_entry["request"]["method"] in ["POST", "PUT", "PATCH"]:
            log_entry["request"]["size"] = random.randint(100, 10000)
            log_entry["request"]["content_type"] = random.choice([
                "application/json", "multipart/form-data", "application/x-www-form-urlencoded"
            ])
        
        # Add response size
        log_entry["response"]["size"] = random.randint(200, 50000)
        
        # Generate message
        log_entry["message"] = f"{log_entry['request']['method']} {log_entry['request']['url']} - {log_entry['response']['status']}"
        
        return log_entry

    def generate_error_log(self) -> Dict:
        """Generate user service error log entry"""
        error_levels = ["ERROR", "WARN", "FATAL"]
        level_weights = [0.8, 0.15, 0.05]
        
        log_entry = {
            "timestamp": self.generate_timestamp(),
            "level": random.choices(error_levels, weights=level_weights)[0],
            "service": "user-service",
            "request_id": self.generate_request_id(),
            "user_id": random.choice(self.user_ids),
            "username": random.choice(self.usernames),
            "session_id": random.choice(self.session_ids),
            "error_code": random.choice(self.error_types),
            "success": False
        }
        
        # Generate error-specific details
        error_messages = {
            "validation_error": "Invalid input data provided",
            "authentication_failed": "Authentication credentials are invalid",
            "authorization_denied": "User does not have permission to perform this action",
            "user_not_found": "User not found in database",
            "email_already_exists": "Email address is already registered",
            "username_taken": "Username is already taken",
            "invalid_password": "Password does not meet security requirements",
            "session_expired": "User session has expired",
            "rate_limit_exceeded": "Too many requests from this user",
            "database_error": "Database connection failed",
            "network_timeout": "Network request timed out",
            "service_unavailable": "External service is unavailable",
            "invalid_token": "Authentication token is invalid",
            "expired_token": "Authentication token has expired",
            "permission_denied": "Insufficient permissions for this resource"
        }
        
        log_entry["error"] = error_messages.get(log_entry["error_code"], "Unknown error occurred")
        log_entry["message"] = f"Error in user service: {log_entry['error']}"
        
        # Add error context
        if log_entry["error_code"] in ["database_error", "network_timeout"]:
            log_entry["retry_count"] = random.randint(0, 3)
            log_entry["error_reason"] = random.choice(["connection_timeout", "connection_refused", "query_timeout"])
        
        if log_entry["error_code"] == "validation_error":
            log_entry["validation_errors"] = random.sample([
                "email_format", "password_length", "username_length", "required_field"
            ], k=random.randint(1, 3))
        
        # Add request details for context
        log_entry["request"] = {
            "method": random.choice(["POST", "PUT", "PATCH"]),
            "url": random.choice(self.endpoints),
            "ip": random.choice(self.ip_addresses)
        }
        
        # Add stack trace for ERROR/FATAL levels
        if log_entry["level"] in ["ERROR", "FATAL"]:
            log_entry["stack_trace"] = [
                "com.fttranscendence.user.service.UserService.processRequest(UserService.java:145)",
                "com.fttranscendence.user.controller.UserController.handleRequest(UserController.java:89)",
                "com.fttranscendence.common.handler.RequestHandler.process(RequestHandler.java:234)"
            ]
        
        return log_entry

    def write_log_entry(self, log_entry: Dict, file_path: Path):
        """Write log entry to file"""
        with open(file_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")

    def generate_user_logs(self, interval: float = 2.0):
        """Generate user.log entries"""
        while self.running:
            log_entry = self.generate_user_log()
            self.write_log_entry(log_entry, self.user_log_path)
            time.sleep(interval + random.uniform(-0.5, 0.5))

    def generate_access_logs(self, interval: float = 1.0):
        """Generate user-access.log entries"""
        while self.running:
            log_entry = self.generate_access_log()
            self.write_log_entry(log_entry, self.user_access_log_path)
            time.sleep(interval + random.uniform(-0.3, 0.3))

    def generate_error_logs(self, interval: float = 8.0):
        """Generate user-error.log entries"""
        while self.running:
            log_entry = self.generate_error_log()
            self.write_log_entry(log_entry, self.user_error_log_path)
            time.sleep(interval + random.uniform(-2.0, 2.0))

    def start_generation(self):
        """Start log generation in separate threads"""
        self.running = True
        
        # Create log files if they don't exist
        for log_file in [self.user_log_path, self.user_access_log_path, self.user_error_log_path]:
            log_file.touch(exist_ok=True)
        
        # Start threads for each log type
        self.threads = [
            threading.Thread(target=self.generate_user_logs, daemon=True),
            threading.Thread(target=self.generate_access_logs, daemon=True),
            threading.Thread(target=self.generate_error_logs, daemon=True)
        ]
        
        for thread in self.threads:
            thread.start()
        
        print(f"✓ User service log generation started")
        print(f"📂 Log directory: {self.log_dir}")
        print(f"📄 User logs: {self.user_log_path}")
        print(f"📄 Access logs: {self.user_access_log_path}")
        print(f"📄 Error logs: {self.user_error_log_path}")
        print(" Press Ctrl+C to stop...")

    def stop_generation(self):
        """Stop log generation"""
        self.running = False
        for thread in self.threads:
            if thread.is_alive():
                thread.join(timeout=1.0)
        print(" Log generation stopped")

    def generate_sample_logs(self, count: int = 10):
        """Generate a specific number of sample logs for testing"""
        print(f"Generating {count} sample logs...")
        
        # Create log files if they don't exist
        for log_file in [self.user_log_path, self.user_access_log_path, self.user_error_log_path]:
            log_file.touch(exist_ok=True)
        
        # Generate sample logs
        for i in range(count):
            # Generate one of each type
            user_log = self.generate_user_log()
            access_log = self.generate_access_log()
            error_log = self.generate_error_log()
            
            self.write_log_entry(user_log, self.user_log_path)
            self.write_log_entry(access_log, self.user_access_log_path)
            self.write_log_entry(error_log, self.user_error_log_path)
            
            print(f"Generated log set {i+1}/{count}")
            time.sleep(0.1)  # Small delay to ensure different timestamps
        
        print(f"✓ Sample logs generated successfully!")
        print(f"📂 Check logs in: {self.log_dir}")


def main():
    """Main function to run the log generator"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate user service logs for ft-transcendence")
    parser.add_argument("--log-dir", default="/var/log/ft-transcendence/user-service", 
                       help="Directory to store log files")
    parser.add_argument("--sample", type=int, help="Generate N sample logs and exit")
    parser.add_argument("--continuous", action="store_true", 
                       help="Generate logs continuously")
    
    args = parser.parse_args()
    
    generator = UserServiceLogGenerator(args.log_dir)
    
    if args.sample:
        generator.generate_sample_logs(args.sample)
    elif args.continuous:
        try:
            generator.start_generation()
            # Keep the main thread alive
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            generator.stop_generation()
    else:
        # Default: generate 20 sample logs
        generator.generate_sample_logs(20)


if __name__ == "__main__":
    main()
