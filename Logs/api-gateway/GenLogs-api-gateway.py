#!/usr/bin/env python3
"""
API Gateway Log Generator for ft-transcendence
Generates realistic logs for access.log, error.log, and gateway.log
Based on the ELK configuration and Logstash pipeline
"""

import json
import random
import time
import threading
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from urllib.parse import urlparse
import uuid

class APIGatewayLogGenerator:
    def __init__(self, log_dir: str = "/var/log/ft-transcendence/api-gateway"):
        self.log_dir = log_dir
        self.ensure_directory_exists()
        
        # Common API endpoints for ft-transcendence
        self.endpoints = [
            "/api/v1/auth/login",
            "/api/v1/auth/logout",
            "/api/v1/auth/register",
            "/api/v1/auth/verify",
            "/api/v1/auth/refresh",
            "/api/v1/users/profile",
            "/api/v1/users/settings",
            "/api/v1/users/avatar",
            "/api/v1/users/friends",
            "/api/v1/users/search",
            "/api/v1/chat/messages",
            "/api/v1/chat/channels",
            "/api/v1/chat/rooms",
            "/api/v1/chat/history",
            "/api/v1/games/create",
            "/api/v1/games/join",
            "/api/v1/games/state",
            "/api/v1/games/leaderboard",
            "/api/v1/games/history",
            "/api/v1/tournaments/create",
            "/api/v1/tournaments/join",
            "/api/v1/tournaments/brackets",
            "/api/v1/tournaments/schedule",
            "/api/v1/matches/create",
            "/api/v1/matches/results",
            "/api/v1/matches/statistics",
            "/api/v1/notifications/list",
            "/api/v1/notifications/mark-read",
            "/api/v1/files/upload",
            "/api/v1/files/download",
            "/api/v1/stats/user",
            "/api/v1/stats/game",
            "/api/v1/stats/tournament",
            "/health",
            "/metrics",
            "/api/status"
        ]
        
        # HTTP methods distribution
        self.methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        self.method_weights = [0.5, 0.25, 0.1, 0.05, 0.05, 0.05]
        
        # Status codes distribution
        self.status_codes = {
            200: 0.7,   # OK
            201: 0.08,  # Created
            204: 0.03,  # No Content
            304: 0.02,  # Not Modified
            400: 0.05,  # Bad Request
            401: 0.04,  # Unauthorized
            403: 0.02,  # Forbidden
            404: 0.03,  # Not Found
            409: 0.01,  # Conflict
            422: 0.01,  # Unprocessable Entity
            500: 0.005, # Internal Server Error
            502: 0.003, # Bad Gateway
            503: 0.002, # Service Unavailable
        }
        
        # User agents
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
            "Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0",
            "ft-transcendence-mobile/1.0.0 (iOS)",
            "ft-transcendence-desktop/1.2.0 (Windows)",
            "ft-transcendence-web/2.1.0"
        ]
        
        # IP address pools
        self.ip_pools = [
            "192.168.1.{}",
            "10.0.0.{}",
            "172.16.0.{}",
            "203.0.113.{}",  # Test network
            "198.51.100.{}",  # Test network
        ]
        
        # Usernames for simulation
        self.usernames = [
            "player1", "gamer_pro", "pong_master", "tournament_king",
            "chat_lover", "speedrun_hero", "casual_player", "esports_fan",
            "retro_gamer", "pong_legend", "game_dev", "ui_designer",
            "backend_ninja", "frontend_guru", "devops_master", "security_expert"
        ]
        
        # Request IDs for correlation
        self.active_requests = {}
        
        # Running flag
        self.running = False
        
    def ensure_directory_exists(self):
        """Create log directory if it doesn't exist"""
        os.makedirs(self.log_dir, exist_ok=True)
        
    def generate_ip(self) -> str:
        """Generate a realistic IP address"""
        pool = random.choice(self.ip_pools)
        return pool.format(random.randint(1, 254))
    
    def generate_request_id(self) -> str:
        """Generate a unique request ID"""
        return str(uuid.uuid4())
    
    def get_weighted_choice(self, choices: Dict) -> str:
        """Get a weighted random choice from a dictionary"""
        items = list(choices.keys())
        weights = list(choices.values())
        return random.choices(items, weights=weights)[0]
    
    def generate_nginx_access_log(self) -> str:
        """Generate nginx-style access log entry"""
        ip = self.generate_ip()
        timestamp = datetime.now().strftime("%d/%b/%Y:%H:%M:%S %z")
        method = random.choices(self.methods, weights=self.method_weights)[0]
        endpoint = random.choice(self.endpoints)
        protocol = "HTTP/1.1"
        status = self.get_weighted_choice(self.status_codes)
        
        # Response size based on endpoint and status
        if status >= 400:
            size = random.randint(100, 500)
        elif endpoint.startswith("/api/v1/files/download"):
            size = random.randint(1000000, 50000000)  # Large files
        elif endpoint.startswith("/api/v1/chat/history"):
            size = random.randint(5000, 50000)  # Chat history
        else:
            size = random.randint(200, 2000)
        
        referrer = random.choice([
            "https://ft-transcendence.42.fr/",
            "https://ft-transcendence.42.fr/game",
            "https://ft-transcendence.42.fr/tournament",
            "https://ft-transcendence.42.fr/chat",
            "-"
        ])
        
        user_agent = random.choice(self.user_agents)
        
        # Nginx combined log format
        return f'{ip} - - [{timestamp}] "{method} {endpoint} {protocol}" {status} {size} "{referrer}" "{user_agent}"'
    
    def generate_gateway_json_log(self) -> str:
        """Generate structured JSON log for gateway.log"""
        timestamp = datetime.now().isoformat()
        request_id = self.generate_request_id()
        method = random.choices(self.methods, weights=self.method_weights)[0]
        endpoint = random.choice(self.endpoints)
        status = self.get_weighted_choice(self.status_codes)
        
        # Response time based on endpoint complexity
        if endpoint.startswith("/api/v1/files/"):
            response_time = random.uniform(0.5, 3.0)
        elif endpoint.startswith("/api/v1/games/"):
            response_time = random.uniform(0.1, 0.8)
        elif endpoint.startswith("/api/v1/auth/"):
            response_time = random.uniform(0.2, 1.0)
        else:
            response_time = random.uniform(0.05, 0.5)
        
        # Determine log level based on status
        if status >= 500:
            level = "ERROR"
        elif status >= 400:
            level = "WARN"
        else:
            level = "INFO"
        
        # Target service routing
        if endpoint.startswith("/api/v1/auth/"):
            target_service = "auth-service"
        elif endpoint.startswith("/api/v1/chat/"):
            target_service = "chat-service"
        elif endpoint.startswith("/api/v1/games/"):
            target_service = "game-service"
        elif endpoint.startswith("/api/v1/users/"):
            target_service = "user-service"
        elif endpoint.startswith("/api/v1/tournaments/"):
            target_service = "tournament-service"
        elif endpoint.startswith("/api/v1/matches/"):
            target_service = "match-service"
        elif endpoint.startswith("/api/v1/notifications/"):
            target_service = "notification-service"
        elif endpoint.startswith("/api/v1/files/"):
            target_service = "file-service"
        elif endpoint.startswith("/api/v1/stats/"):
            target_service = "stats-service"
        else:
            target_service = "unknown"
        
        log_entry = {
            "timestamp": timestamp,
            "level": level,
            "service": "api-gateway",
            "message": f"Gateway request processed",
            "request_id": request_id,
            "request": {
                "method": method,
                "url": endpoint,
                "ip": self.generate_ip(),
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": status,
                "time": round(response_time, 3),
                "duration": round(response_time * 1000, 2)  # milliseconds
            },
            "routing": {
                "target_service": target_service,
                "upstream_status": "healthy" if status < 500 else "unhealthy"
            }
        }
        
        # Add user context for authenticated endpoints
        if endpoint.startswith("/api/v1/") and not endpoint.startswith("/api/v1/auth/login"):
            if random.random() > 0.1:  # 90% authenticated requests
                log_entry["user_id"] = str(random.randint(1000, 9999))
                log_entry["username"] = random.choice(self.usernames)
                log_entry["session_id"] = str(uuid.uuid4())
        
        # Add error details for error responses
        if status >= 400:
            error_messages = {
                400: "Bad Request - Invalid parameters",
                401: "Unauthorized - Invalid or missing token",
                403: "Forbidden - Insufficient permissions",
                404: "Not Found - Resource not found",
                409: "Conflict - Resource already exists",
                422: "Unprocessable Entity - Validation failed",
                500: "Internal Server Error - Upstream service error",
                502: "Bad Gateway - Service unavailable",
                503: "Service Unavailable - Rate limit exceeded"
            }
            log_entry["error_message"] = error_messages.get(status, "Unknown error")
            log_entry["error_code"] = f"GATEWAY_{status}"
        
        return json.dumps(log_entry)
    
    def generate_error_log(self) -> str:
        """Generate error log entry"""
        timestamp = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
        
        error_types = [
            "upstream timed out",
            "connection refused while connecting to upstream",
            "SSL handshake failed",
            "rate limit exceeded",
            "invalid request format",
            "service discovery failed",
            "circuit breaker opened",
            "health check failed",
            "authentication service unreachable",
            "database connection pool exhausted"
        ]
        
        error_type = random.choice(error_types)
        client_ip = self.generate_ip()
        endpoint = random.choice(self.endpoints)
        
        # Different error log formats
        if "upstream" in error_type:
            target_service = random.choice([
                "auth-service:8001",
                "chat-service:8002", 
                "game-service:8003",
                "user-service:8004"
            ])
            return f'{timestamp} [error] upstream {error_type} ({target_service}) while connecting to upstream, client: {client_ip}, server: api-gateway, request: "GET {endpoint} HTTP/1.1"'
        elif "rate limit" in error_type:
            return f'{timestamp} [warn] {error_type} for client {client_ip}, request: "{endpoint}"'
        else:
            return f'{timestamp} [error] {error_type}, client: {client_ip}, request: "{endpoint}"'
    
    def write_logs(self, log_type: str, content: str):
        """Write log content to appropriate file"""
        filename = os.path.join(self.log_dir, f"{log_type}.log")
        with open(filename, 'a') as f:
            f.write(content + '\n')
            f.flush()
    
    def generate_access_logs(self):
        """Generate access logs continuously"""
        while self.running:
            try:
                # Generate 5-15 access logs per second
                for _ in range(random.randint(5, 15)):
                    if not self.running:
                        break
                    log_entry = self.generate_nginx_access_log()
                    self.write_logs("access", log_entry)
                    time.sleep(random.uniform(0.05, 0.2))
                
                time.sleep(1)
            except Exception as e:
                print(f"Error generating access logs: {e}")
                time.sleep(1)
    
    def generate_gateway_logs(self):
        """Generate gateway logs continuously"""
        while self.running:
            try:
                # Generate 3-8 gateway logs per second
                for _ in range(random.randint(3, 8)):
                    if not self.running:
                        break
                    log_entry = self.generate_gateway_json_log()
                    self.write_logs("gateway", log_entry)
                    time.sleep(random.uniform(0.1, 0.3))
                
                time.sleep(1)
            except Exception as e:
                print(f"Error generating gateway logs: {e}")
                time.sleep(1)
    
    def generate_error_logs(self):
        """Generate error logs continuously"""
        while self.running:
            try:
                # Generate 1-3 error logs per minute
                if random.random() < 0.05:  # 5% chance per second
                    log_entry = self.generate_error_log()
                    self.write_logs("error", log_entry)
                
                time.sleep(1)
            except Exception as e:
                print(f"Error generating error logs: {e}")
                time.sleep(1)
    
    def start(self):
        """Start log generation"""
        print(f"Starting API Gateway log generation...")
        print(f"Log directory: {self.log_dir}")
        print("Generating logs for:")
        print("  - access.log (Nginx access logs)")
        print("  - gateway.log (Structured JSON logs)")
        print("  - error.log (Error logs)")
        print("Press Ctrl+C to stop")
        
        self.running = True
        
        # Start threads for different log types
        threads = [
            threading.Thread(target=self.generate_access_logs, daemon=True),
            threading.Thread(target=self.generate_gateway_logs, daemon=True),
            threading.Thread(target=self.generate_error_logs, daemon=True)
        ]
        
        for thread in threads:
            thread.start()
        
        try:
            # Keep main thread alive
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping log generation...")
            self.running = False
            
        # Wait for threads to finish
        for thread in threads:
            thread.join(timeout=2)
            
        print("Log generation stopped.")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate API Gateway logs for ft-transcendence')
    parser.add_argument('--log-dir', default='/var/log/ft-transcendence/api-gateway',
                        help='Directory to write logs (default: /var/log/ft-transcendence/api-gateway)')
    parser.add_argument('--duration', type=int, default=0,
                        help='Duration to run in seconds (0 = run indefinitely)')
    
    args = parser.parse_args()
    
    # Create log generator
    generator = APIGatewayLogGenerator(log_dir=args.log_dir)
    
    if args.duration > 0:
        # Run for specific duration
        print(f"Running for {args.duration} seconds...")
        generator.running = True
        
        threads = [
            threading.Thread(target=generator.generate_access_logs, daemon=True),
            threading.Thread(target=generator.generate_gateway_logs, daemon=True),
            threading.Thread(target=generator.generate_error_logs, daemon=True)
        ]
        
        for thread in threads:
            thread.start()
            
        time.sleep(args.duration)
        generator.running = False
        
        for thread in threads:
            thread.join(timeout=2)
            
        print("Log generation completed.")
    else:
        # Run indefinitely
        generator.start()

if __name__ == "__main__":
    main()
