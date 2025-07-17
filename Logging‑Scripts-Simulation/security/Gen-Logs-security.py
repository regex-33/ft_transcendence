#!/usr/bin/env python3
"""
Security Logs Generator for ft-transcendence
Generates realistic security logs for testing ELK stack configuration
"""

import json
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List
import threading
import os
import sys

class SecurityLogsGenerator:
    def __init__(self, log_directory: str = "/var/log/ft-transcendence/security"):
        self.log_directory = log_directory
        self.ensure_directory_exists()
        
        # Common IP addresses for simulation
        self.legitimate_ips = [
            "192.168.1.100", "192.168.1.101", "192.168.1.102",
            "10.0.0.50", "10.0.0.51", "172.16.0.10"
        ]
        
        self.suspicious_ips = [
            "1.2.3.4", "5.6.7.8", "9.10.11.12", "13.14.15.16",
            "185.220.101.32", "198.51.100.1", "203.0.113.1"
        ]
        
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            "python-requests/2.28.1",
            "curl/7.81.0",
            "PostmanRuntime/7.29.2"
        ]
        
        self.usernames = [
            "admin", "user123", "john_doe", "alice_smith", "bob_wilson",
            "test_user", "developer", "guest", "support", "demo_user"
        ]
        
        self.attack_patterns = [
            "SQL injection attempt", "XSS attempt", "Directory traversal",
            "Brute force attack", "Command injection", "File inclusion attack",
            "CSRF attempt", "Authentication bypass", "Session hijacking",
            "API abuse", "Rate limit exceeded", "Suspicious file upload"
        ]
        
        self.security_events = [
            "login_attempt", "login_success", "login_failure", "logout",
            "password_change", "account_locked", "suspicious_activity",
            "rate_limit_exceeded", "invalid_token", "permission_denied",
            "security_scan_detected", "malicious_payload_detected"
        ]

    def ensure_directory_exists(self):
        """Create log directory if it doesn't exist"""
        os.makedirs(self.log_directory, exist_ok=True)

    def generate_timestamp(self) -> str:
        """Generate ISO 8601 timestamp with slight randomness"""
        now = datetime.now()
        # Add some randomness (±30 seconds)
        random_offset = timedelta(seconds=random.randint(-30, 30))
        timestamp = now + random_offset
        return timestamp.isoformat() + "Z"

    def generate_request_id(self) -> str:
        """Generate realistic request ID"""
        return f"req_{random.randint(100000, 999999)}"

    def generate_session_id(self) -> str:
        """Generate realistic session ID"""
        return f"sess_{random.randint(1000000, 9999999)}"

    def generate_security_log(self) -> Dict:
        """Generate general security log entry"""
        event_type = random.choice(self.security_events)
        is_suspicious = random.choice([True, False, False, False])  # 25% suspicious
        
        source_ip = random.choice(self.suspicious_ips if is_suspicious else self.legitimate_ips)
        
        log_entry = {
            "timestamp": self.generate_timestamp(),
            "level": "WARN" if is_suspicious else "INFO",
            "service": "auth-service",
            "message": f"Security event: {event_type}",
            "request_id": self.generate_request_id(),
            "session_id": self.generate_session_id(),
            "user_id": random.randint(1, 1000),
            "username": random.choice(self.usernames),
            "action": event_type,
            "success": not is_suspicious,
            "source_ip": source_ip,
            "request": {
                "method": random.choice(["POST", "GET", "PUT", "DELETE"]),
                "url": f"/api/v1/auth/{event_type.replace('_', '-')}",
                "ip": source_ip,
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": 403 if is_suspicious else 200,
                "duration": random.uniform(0.1, 2.0)
            },
            "security_event": event_type,
            "threat_level": "HIGH" if is_suspicious else "LOW",
            "details": {
                "event_id": f"sec_{random.randint(10000, 99999)}",
                "classification": "suspicious" if is_suspicious else "normal",
                "risk_score": random.randint(7, 10) if is_suspicious else random.randint(1, 3)
            }
        }
        
        if is_suspicious:
            log_entry["error_message"] = f"Suspicious activity detected: {random.choice(self.attack_patterns)}"
            log_entry["error_code"] = "SEC_VIOLATION"
        
        return log_entry

    def generate_failed_login_log(self) -> Dict:
        """Generate failed login log entry"""
        is_brute_force = random.choice([True, False, False])  # 33% brute force
        source_ip = random.choice(self.suspicious_ips if is_brute_force else self.legitimate_ips)
        
        log_entry = {
            "timestamp": self.generate_timestamp(),
            "level": "WARN",
            "service": "auth-service",
            "message": "Authentication failed",
            "request_id": self.generate_request_id(),
            "session_id": self.generate_session_id(),
            "username": random.choice(self.usernames),
            "action": "login_attempt",
            "success": False,
            "source_ip": source_ip,
            "request": {
                "method": "POST",
                "url": "/api/v1/auth/login",
                "ip": source_ip,
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": 401,
                "duration": random.uniform(0.5, 1.5)
            },
            "security_event": "login_failure",
            "threat_level": "HIGH" if is_brute_force else "MEDIUM",
            "error_message": "Invalid credentials",
            "error_code": "AUTH_FAILED",
            "details": {
                "attempt_count": random.randint(1, 10) if is_brute_force else 1,
                "failure_reason": random.choice([
                    "invalid_password", "invalid_username", "account_locked",
                    "expired_password", "account_disabled"
                ]),
                "time_since_last_attempt": random.uniform(0.1, 60.0)
            }
        }
        
        if is_brute_force:
            log_entry["message"] = "Potential brute force attack detected"
            log_entry["details"]["attack_pattern"] = "brute_force"
            log_entry["details"]["consecutive_failures"] = random.randint(5, 20)
        
        return log_entry

    def generate_suspicious_activity_log(self) -> Dict:
        """Generate suspicious activity log entry"""
        attack_type = random.choice(self.attack_patterns)
        source_ip = random.choice(self.suspicious_ips)
        
        log_entry = {
            "timestamp": self.generate_timestamp(),
            "level": "ERROR",
            "service": "auth-service",
            "message": f"Suspicious activity detected: {attack_type}",
            "request_id": self.generate_request_id(),
            "session_id": self.generate_session_id(),
            "user_id": random.randint(1, 1000),
            "username": random.choice(self.usernames),
            "action": "security_violation",
            "success": False,
            "source_ip": source_ip,
            "request": {
                "method": random.choice(["POST", "GET", "PUT", "DELETE"]),
                "url": f"/api/v1/{random.choice(['auth', 'user', 'game', 'chat'])}/{random.choice(['login', 'profile', 'match', 'message'])}",
                "ip": source_ip,
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": random.choice([403, 429, 400, 500]),
                "duration": random.uniform(0.1, 5.0)
            },
            "security_event": "malicious_activity",
            "threat_level": "CRITICAL",
            "error_message": f"Security violation: {attack_type}",
            "error_code": "SECURITY_VIOLATION",
            "details": {
                "attack_type": attack_type,
                "payload_size": random.randint(100, 10000),
                "blocked": True,
                "rule_triggered": f"rule_{random.randint(1000, 9999)}",
                "confidence_score": random.uniform(0.8, 1.0),
                "geolocation": random.choice([
                    "Unknown", "Russia", "China", "North Korea", "Iran", "Brazil"
                ])
            }
        }
        
        return log_entry

    def write_log_to_file(self, log_entry: Dict, filename: str):
        """Write log entry to specified file"""
        filepath = os.path.join(self.log_directory, filename)
        with open(filepath, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')

    def generate_security_logs(self, count: int = 10):
        """Generate general security logs"""
        print(f"Generating {count} security logs...")
        for _ in range(count):
            log_entry = self.generate_security_log()
            self.write_log_to_file(log_entry, "security.log")
            time.sleep(random.uniform(0.1, 0.5))

    def generate_failed_login_logs(self, count: int = 5):
        """Generate failed login logs"""
        print(f"Generating {count} failed login logs...")
        for _ in range(count):
            log_entry = self.generate_failed_login_log()
            self.write_log_to_file(log_entry, "failed-logins.log")
            time.sleep(random.uniform(0.2, 1.0))

    def generate_suspicious_activity_logs(self, count: int = 3):
        """Generate suspicious activity logs"""
        print(f"Generating {count} suspicious activity logs...")
        for _ in range(count):
            log_entry = self.generate_suspicious_activity_log()
            self.write_log_to_file(log_entry, "suspicious-activity.log")
            time.sleep(random.uniform(0.5, 2.0))

    def generate_all_logs(self, security_count: int = 10, failed_login_count: int = 5, suspicious_count: int = 3):
        """Generate all types of security logs"""
        print(f"Starting security log generation in {self.log_directory}")
        
        # Use threading to generate logs concurrently (more realistic)
        threads = [
            threading.Thread(target=self.generate_security_logs, args=(security_count,)),
            threading.Thread(target=self.generate_failed_login_logs, args=(failed_login_count,)),
            threading.Thread(target=self.generate_suspicious_activity_logs, args=(suspicious_count,))
        ]
        
        for thread in threads:
            thread.start()
        
        for thread in threads:
            thread.join()
        
        print("✅ All security logs generated successfully!")

    def continuous_generation(self, interval: int = 30):
        """Generate logs continuously"""
        print(f"Starting continuous log generation (every {interval} seconds)")
        print("Press Ctrl+C to stop...")
        
        try:
            while True:
                self.generate_all_logs(
                    security_count=random.randint(5, 15),
                    failed_login_count=random.randint(2, 8),
                    suspicious_count=random.randint(1, 5)
                )
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n⏹️  Log generation stopped.")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate security logs for ft-transcendence")
    parser.add_argument("--log-dir", default="/var/log/ft-transcendence/security", 
                       help="Log directory (default: /var/log/ft-transcendence/security)")
    parser.add_argument("--security-count", type=int, default=10,
                       help="Number of security logs to generate (default: 10)")
    parser.add_argument("--failed-login-count", type=int, default=5,
                       help="Number of failed login logs to generate (default: 5)")
    parser.add_argument("--suspicious-count", type=int, default=3,
                       help="Number of suspicious activity logs to generate (default: 3)")
    parser.add_argument("--continuous", action="store_true",
                       help="Generate logs continuously")
    parser.add_argument("--interval", type=int, default=30,
                       help="Interval for continuous generation in seconds (default: 30)")
    
    args = parser.parse_args()
    
    generator = SecurityLogsGenerator(args.log_dir)
    
    if args.continuous:
        generator.continuous_generation(args.interval)
    else:
        generator.generate_all_logs(
            security_count=args.security_count,
            failed_login_count=args.failed_login_count,
            suspicious_count=args.suspicious_count
        )

if __name__ == "__main__":
    main()
