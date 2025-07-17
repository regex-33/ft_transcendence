#!/usr/bin/env python3
"""
Auth Service Log Generator for ft-transcendence
Generates realistic authentication logs matching ELK pipeline expectations
"""

import json
import random
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import threading
import argparse

class AuthLogGenerator:
    def __init__(self, log_dir: str = "/var/log/ft-transcendence/auth-service"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Log file paths
        self.auth_log = self.log_dir / "auth.log"
        self.auth_access_log = self.log_dir / "auth-access.log"
        self.auth_error_log = self.log_dir / "auth-error.log"
        self.auth_security_log = self.log_dir / "auth-security.log"
        self.security_events_log = self.log_dir / "security-events.log"
        
        # Sample data for realistic logs
        self.usernames = [
            "player1", "gamer42", "pongmaster", "challenger", "novice",
            "champion", "speedster", "striker", "defender", "rookie",
            "veteran", "legend", "ace", "phoenix", "shadow", "storm",
            "blade", "flash", "ghost", "hunter", "ninja", "wizard"
        ]
        
        self.actions = [
            "login", "logout", "register", "password_change", "token_refresh",
            "profile_update", "session_validate", "password_reset", "2fa_enable",
            "2fa_disable", "email_verify", "account_lock", "account_unlock"
        ]
        
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
            "Mozilla/5.0 (Android 11; Mobile; rv:89.0) Gecko/89.0"
        ]
        
        self.ip_addresses = [
            "192.168.1.100", "10.0.0.50", "172.16.0.25", "203.0.113.45",
            "198.51.100.75", "192.168.1.200", "10.0.0.100", "172.16.0.50"
        ]
        
        self.threat_levels = ["low", "medium", "high", "critical"]
        self.security_events = [
            "failed_login_attempt", "suspicious_login", "account_lockout",
            "brute_force_detected", "unusual_location", "multiple_sessions",
            "privilege_escalation", "session_hijacking", "token_theft"
        ]
        
        self.error_codes = [
            "AUTH_001", "AUTH_002", "AUTH_003", "AUTH_004", "AUTH_005",
            "SEC_001", "SEC_002", "SEC_003", "VAL_001", "VAL_002"
        ]
        
        self.running = False
        
    def generate_timestamp(self) -> str:
        """Generate ISO timestamp"""
        return datetime.now().isoformat() + "Z"
    
    def generate_request_id(self) -> str:
        """Generate unique request ID"""
        return str(uuid.uuid4())
    
    def generate_session_id(self) -> str:
        """Generate session ID"""
        return str(uuid.uuid4())[:16]
    
    def generate_user_id(self) -> str:
        """Generate user ID"""
        return str(random.randint(1000, 9999))
    
    def create_base_log_entry(self, service: str = "auth-service") -> Dict:
        """Create base log entry with common fields"""
        return {
            "timestamp": self.generate_timestamp(),
            "service": service,
            "request_id": self.generate_request_id(),
            "session_id": self.generate_session_id(),
            "level": "INFO"
        }
    
    def generate_auth_log(self) -> Dict:
        """Generate general auth service log"""
        entry = self.create_base_log_entry()
        
        action = random.choice(self.actions)
        success = random.choice([True, True, True, False])  # 75% success rate
        
        entry.update({
            "action": action,
            "user_id": self.generate_user_id(),
            "username": random.choice(self.usernames),
            "success": success,
            "message": f"User {action} {'successful' if success else 'failed'}",
            "request": {
                "method": "POST",
                "url": f"/api/auth/{action}",
                "ip": random.choice(self.ip_addresses),
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": 200 if success else random.choice([400, 401, 403, 429]),
                "duration": round(random.uniform(0.1, 2.0), 3)
            }
        })
        
        if not success:
            entry["level"] = "WARN"
            entry["error_code"] = random.choice(self.error_codes)
            entry["error_reason"] = f"{action}_failed"
        
        return entry
    
    def generate_auth_access_log(self) -> Dict:
        """Generate auth access log (successful requests)"""
        entry = self.create_base_log_entry()
        
        action = random.choice(["login", "token_refresh", "session_validate", "logout"])
        
        entry.update({
            "action": action,
            "user_id": self.generate_user_id(),
            "username": random.choice(self.usernames),
            "success": True,
            "message": f"Access granted for {action}",
            "request": {
                "method": random.choice(["GET", "POST"]),
                "url": f"/api/auth/{action}",
                "ip": random.choice(self.ip_addresses),
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": 200,
                "duration": round(random.uniform(0.05, 0.5), 3)
            }
        })
        
        return entry
    
    def generate_auth_error_log(self) -> Dict:
        """Generate auth error log"""
        entry = self.create_base_log_entry()
        entry["level"] = "ERROR"
        
        action = random.choice(self.actions)
        error_messages = [
            "Invalid credentials provided",
            "Token expired",
            "User account locked",
            "Database connection failed",
            "Rate limit exceeded",
            "Invalid request format",
            "Session not found",
            "Permission denied"
        ]
        
        entry.update({
            "action": action,
            "user_id": self.generate_user_id(),
            "username": random.choice(self.usernames),
            "success": False,
            "message": f"Error during {action}",
            "error": random.choice(error_messages),
            "error_code": random.choice(self.error_codes),
            "error_reason": f"{action}_error",
            "request": {
                "method": "POST",
                "url": f"/api/auth/{action}",
                "ip": random.choice(self.ip_addresses),
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": random.choice([400, 401, 403, 429, 500]),
                "duration": round(random.uniform(0.1, 3.0), 3)
            }
        })
        
        return entry
    
    def generate_auth_security_log(self) -> Dict:
        """Generate auth security log"""
        entry = self.create_base_log_entry()
        entry["level"] = "WARN"
        
        security_event = random.choice(self.security_events)
        
        entry.update({
            "security_event": security_event,
            "user_id": self.generate_user_id(),
            "username": random.choice(self.usernames),
            "threat_level": random.choice(self.threat_levels),
            "source_ip": random.choice(self.ip_addresses),
            "message": f"Security event: {security_event}",
            "action": "security_check",
            "success": False,
            "request": {
                "method": "POST",
                "url": "/api/auth/login",
                "ip": random.choice(self.ip_addresses),
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": random.choice([401, 403, 429]),
                "duration": round(random.uniform(0.1, 1.0), 3)
            }
        })
        
        if security_event in ["brute_force_detected", "privilege_escalation"]:
            entry["level"] = "ERROR"
            entry["threat_level"] = "high"
        
        return entry
    
    def generate_security_events_log(self) -> Dict:
        """Generate security events log"""
        entry = self.create_base_log_entry()
        entry["level"] = "WARN"
        
        security_event = random.choice(self.security_events)
        threat_level = random.choice(self.threat_levels)
        
        entry.update({
            "security_event": security_event,
            "threat_level": threat_level,
            "source_ip": random.choice(self.ip_addresses),
            "user_id": self.generate_user_id(),
            "username": random.choice(self.usernames),
            "message": f"Security alert: {security_event} detected",
            "action": "security_monitor",
            "success": False,
            "event_type": "security_alert",
            "request": {
                "method": "POST",
                "url": "/api/auth/login",
                "ip": random.choice(self.ip_addresses),
                "user_agent": random.choice(self.user_agents)
            },
            "metadata": {
                "attempts": random.randint(1, 10),
                "time_window": "5m",
                "blocked": threat_level in ["high", "critical"]
            }
        })
        
        if threat_level == "critical":
            entry["level"] = "ERROR"
        
        return entry
    
    def write_log_entry(self, log_file: Path, entry: Dict):
        """Write log entry to file"""
        try:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry) + '\n')
        except Exception as e:
            print(f"Error writing to {log_file}: {e}")
    
    def generate_logs_burst(self, count: int = 50):
        """Generate a burst of logs"""
        for _ in range(count):
            if not self.running:
                break
                
            # Generate different types of logs with different probabilities
            log_type = random.choices(
                ['auth', 'access', 'error', 'security', 'events'],
                weights=[40, 30, 15, 10, 5]
            )[0]
            
            if log_type == 'auth':
                entry = self.generate_auth_log()
                self.write_log_entry(self.auth_log, entry)
            elif log_type == 'access':
                entry = self.generate_auth_access_log()
                self.write_log_entry(self.auth_access_log, entry)
            elif log_type == 'error':
                entry = self.generate_auth_error_log()
                self.write_log_entry(self.auth_error_log, entry)
            elif log_type == 'security':
                entry = self.generate_auth_security_log()
                self.write_log_entry(self.auth_security_log, entry)
            elif log_type == 'events':
                entry = self.generate_security_events_log()
                self.write_log_entry(self.security_events_log, entry)
            
            # Random delay between log entries
            time.sleep(random.uniform(0.1, 0.5))
    
    def continuous_generation(self, interval: float = 2.0):
        """Generate logs continuously"""
        self.running = True
        print(f"Starting continuous log generation in {self.log_dir}")
        print("Press Ctrl+C to stop")
        
        try:
            while self.running:
                # Generate 3-10 log entries per interval
                count = random.randint(3, 10)
                self.generate_logs_burst(count)
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\nStopping log generation...")
            self.running = False
    
    def generate_historical_logs(self, days: int = 7, entries_per_day: int = 1000):
        """Generate historical logs for the past N days"""
        print(f"Generating {entries_per_day} entries per day for {days} days...")
        
        for day in range(days):
            target_date = datetime.now() - timedelta(days=day)
            
            for _ in range(entries_per_day):
                # Override timestamp for historical data
                historical_timestamp = target_date + timedelta(
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59)
                )
                
                log_type = random.choices(
                    ['auth', 'access', 'error', 'security', 'events'],
                    weights=[40, 30, 15, 10, 5]
                )[0]
                
                if log_type == 'auth':
                    entry = self.generate_auth_log()
                    entry["timestamp"] = historical_timestamp.isoformat() + "Z"
                    self.write_log_entry(self.auth_log, entry)
                elif log_type == 'access':
                    entry = self.generate_auth_access_log()
                    entry["timestamp"] = historical_timestamp.isoformat() + "Z"
                    self.write_log_entry(self.auth_access_log, entry)
                elif log_type == 'error':
                    entry = self.generate_auth_error_log()
                    entry["timestamp"] = historical_timestamp.isoformat() + "Z"
                    self.write_log_entry(self.auth_error_log, entry)
                elif log_type == 'security':
                    entry = self.generate_auth_security_log()
                    entry["timestamp"] = historical_timestamp.isoformat() + "Z"
                    self.write_log_entry(self.auth_security_log, entry)
                elif log_type == 'events':
                    entry = self.generate_security_events_log()
                    entry["timestamp"] = historical_timestamp.isoformat() + "Z"
                    self.write_log_entry(self.security_events_log, entry)
            
            print(f"Generated logs for {target_date.strftime('%Y-%m-%d')}")
        
        print("Historical log generation complete!")

def main():
    parser = argparse.ArgumentParser(description='Generate auth service logs for ft-transcendence')
    parser.add_argument('--log-dir', default='/var/log/ft-transcendence/auth-service',
                        help='Directory to write logs (default: /var/log/ft-transcendence/auth-service)')
    parser.add_argument('--mode', choices=['continuous', 'historical', 'burst'], default='continuous',
                        help='Generation mode (default: continuous)')
    parser.add_argument('--interval', type=float, default=2.0,
                        help='Interval between log bursts in seconds (default: 2.0)')
    parser.add_argument('--days', type=int, default=7,
                        help='Number of days for historical mode (default: 7)')
    parser.add_argument('--entries-per-day', type=int, default=1000,
                        help='Entries per day for historical mode (default: 1000)')
    parser.add_argument('--burst-count', type=int, default=100,
                        help='Number of entries for burst mode (default: 100)')
    
    args = parser.parse_args()
    
    generator = AuthLogGenerator(args.log_dir)
    
    if args.mode == 'continuous':
        generator.continuous_generation(args.interval)
    elif args.mode == 'historical':
        generator.generate_historical_logs(args.days, args.entries_per_day)
    elif args.mode == 'burst':
        print(f"Generating {args.burst_count} log entries...")
        generator.generate_logs_burst(args.burst_count)
        print("Burst generation complete!")

if __name__ == "__main__":
    main()
