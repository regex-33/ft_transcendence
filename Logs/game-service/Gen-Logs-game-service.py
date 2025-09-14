#!/usr/bin/env python3
"""
Game Service Log Generator for ft-transcendence
Generates realistic logs for game service including:
- game.log: General game service logs
- game-error.log: Error logs
- events/game-events.log: Game-specific events
- events/match-events.log: Match-specific events
"""

import json
import random
import time
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any
import threading
from concurrent.futures import ThreadPoolExecutor

class GameServiceLogGenerator:
    def __init__(self, log_base_path: str = "/var/log/ft-transcendence/game-service"):
        self.log_base_path = log_base_path
        self.ensure_directories()
        
        # Game states and data
        self.active_games = {}
        self.active_matches = {}
        self.players = self.generate_players()
        self.game_types = ["pong", "tournament", "ranked", "casual"]
        self.match_statuses = ["waiting", "starting", "active", "paused", "finished", "cancelled"]
        self.game_events = ["player_join", "player_leave", "game_start", "game_end", "score_update", "pause", "resume"]
        self.match_events = ["match_created", "match_started", "match_ended", "player_scored", "ball_hit", "power_up_used"]
        
        # Log levels
        self.log_levels = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]
        
        # Request IDs for correlation
        self.request_ids = []
        
    def ensure_directories(self):
        """Create necessary directories if they don't exist"""
        directories = [
            self.log_base_path,
            f"{self.log_base_path}/events"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            
        # Create log files
        log_files = [
            f"{self.log_base_path}/game.log",
            f"{self.log_base_path}/game-error.log",
            f"{self.log_base_path}/events/game-events.log",
            f"{self.log_base_path}/events/match-events.log"
        ]
        
        for log_file in log_files:
            if not os.path.exists(log_file):
                with open(log_file, 'w') as f:
                    f.write("")
    
    def generate_players(self) -> List[Dict]:
        """Generate a pool of fake players"""
        usernames = [
            "player1", "pongmaster", "ballbuster", "paddle_pro", "gameking",
            "speedster", "champion42", "rookie_player", "pro_gamer", "legend123",
            "newbie", "veteran", "challenger", "grandmaster", "elite_player"
        ]
        
        players = []
        for i, username in enumerate(usernames):
            players.append({
                "user_id": f"user_{i+1000}",
                "username": username,
                "skill_level": random.randint(1, 100),
                "games_played": random.randint(0, 500)
            })
        
        return players
    
    def get_random_player(self) -> Dict:
        """Get a random player from the pool"""
        return random.choice(self.players)
    
    def generate_request_id(self) -> str:
        """Generate a unique request ID"""
        return f"req_{uuid.uuid4().hex[:8]}"
    
    def generate_game_id(self) -> str:
        """Generate a unique game ID"""
        return f"game_{uuid.uuid4().hex[:8]}"
    
    def generate_match_id(self) -> str:
        """Generate a unique match ID"""
        return f"match_{uuid.uuid4().hex[:8]}"
    
    def get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.utcnow().isoformat() + "Z"
    
    def write_log(self, log_file: str, log_entry: Dict):
        """Write a log entry to the specified file"""
        log_path = f"{self.log_base_path}/{log_file}"
        with open(log_path, 'a') as f:
            f.write(json.dumps(log_entry) + "\n")
    
    def generate_general_game_log(self):
        """Generate general game service logs"""
        request_id = self.generate_request_id()
        player = self.get_random_player()
        
        log_patterns = [
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Game service started successfully",
                "request_id": request_id,
                "action": "service_start"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": f"Player {player['username']} connected to game service",
                "request_id": request_id,
                "user_id": player["user_id"],
                "username": player["username"],
                "action": "player_connect"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "DEBUG",
                "service": "game-service",
                "message": "Processing game state update",
                "request_id": request_id,
                "action": "state_update"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Game room created",
                "request_id": request_id,
                "room_id": f"room_{uuid.uuid4().hex[:6]}",
                "action": "room_create"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "WARN",
                "service": "game-service",
                "message": "High CPU usage detected",
                "request_id": request_id,
                "action": "performance_warning",
                "cpu_usage": random.randint(80, 95)
            }
        ]
        
        log_entry = random.choice(log_patterns)
        self.write_log("game.log", log_entry)
    
    def generate_game_error_log(self):
        """Generate game service error logs"""
        request_id = self.generate_request_id()
        player = self.get_random_player()
        
        error_patterns = [
            {
                "timestamp": self.get_timestamp(),
                "level": "ERROR",
                "service": "game-service",
                "message": "Failed to connect to database",
                "request_id": request_id,
                "error": "Connection timeout after 5000ms",
                "error_code": "DB_CONNECTION_TIMEOUT",
                "action": "database_error"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "ERROR",
                "service": "game-service",
                "message": "Game state synchronization failed",
                "request_id": request_id,
                "game_id": self.generate_game_id(),
                "error": "State mismatch between server and client",
                "error_code": "SYNC_FAILED",
                "action": "sync_error"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "ERROR",
                "service": "game-service",
                "message": "Player disconnected unexpectedly",
                "request_id": request_id,
                "user_id": player["user_id"],
                "username": player["username"],
                "error": "WebSocket connection lost",
                "error_code": "PLAYER_DISCONNECT",
                "action": "connection_error"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "FATAL",
                "service": "game-service",
                "message": "Critical game engine failure",
                "request_id": request_id,
                "error": "Memory allocation failed",
                "error_code": "MEMORY_ERROR",
                "action": "engine_failure"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "ERROR",
                "service": "game-service",
                "message": "Invalid game move detected",
                "request_id": request_id,
                "user_id": player["user_id"],
                "username": player["username"],
                "error": "Move validation failed",
                "error_code": "INVALID_MOVE",
                "action": "validation_error"
            }
        ]
        
        log_entry = random.choice(error_patterns)
        self.write_log("game-error.log", log_entry)
    
    def generate_game_events_log(self):
        """Generate game-specific events logs"""
        request_id = self.generate_request_id()
        game_id = self.generate_game_id()
        player = self.get_random_player()
        
        event_patterns = [
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "New game created",
                "request_id": request_id,
                "game_id": game_id,
                "event_type": "game_created",
                "game_type": random.choice(self.game_types),
                "max_players": random.choice([2, 4, 8]),
                "action": "game_create"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Player joined game",
                "request_id": request_id,
                "game_id": game_id,
                "user_id": player["user_id"],
                "username": player["username"],
                "event_type": "player_join",
                "player_count": random.randint(1, 4),
                "action": "player_join"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Game started",
                "request_id": request_id,
                "game_id": game_id,
                "event_type": "game_start",
                "player_count": random.randint(2, 4),
                "game_mode": random.choice(["classic", "tournament", "ranked"]),
                "action": "game_start"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Game ended",
                "request_id": request_id,
                "game_id": game_id,
                "event_type": "game_end",
                "winner": player["username"],
                "duration": random.randint(60, 600),
                "final_score": f"{random.randint(0, 10)}-{random.randint(0, 10)}",
                "action": "game_end"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Game paused",
                "request_id": request_id,
                "game_id": game_id,
                "event_type": "game_pause",
                "paused_by": player["username"],
                "reason": random.choice(["player_request", "network_issue", "admin_action"]),
                "action": "game_pause"
            }
        ]
        
        log_entry = random.choice(event_patterns)
        self.write_log("events/game-events.log", log_entry)
    
    def generate_match_events_log(self):
        """Generate match-specific events logs"""
        request_id = self.generate_request_id()
        match_id = self.generate_match_id()
        game_id = self.generate_game_id()
        player1 = self.get_random_player()
        player2 = self.get_random_player()
        
        event_patterns = [
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Match created",
                "request_id": request_id,
                "match_id": match_id,
                "game_id": game_id,
                "event_type": "match_created",
                "match_type": random.choice(["1v1", "tournament", "ranked"]),
                "players": [player1["username"], player2["username"]],
                "action": "match_create"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Match started",
                "request_id": request_id,
                "match_id": match_id,
                "game_id": game_id,
                "event_type": "match_started",
                "player1": player1["username"],
                "player2": player2["username"],
                "action": "match_start"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Player scored",
                "request_id": request_id,
                "match_id": match_id,
                "game_id": game_id,
                "event_type": "player_scored",
                "scorer": player1["username"],
                "score": f"{random.randint(0, 10)}-{random.randint(0, 10)}",
                "action": "score_update"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "DEBUG",
                "service": "game-service",
                "message": "Ball hit detected",
                "request_id": request_id,
                "match_id": match_id,
                "game_id": game_id,
                "event_type": "ball_hit",
                "player": player1["username"],
                "ball_speed": random.randint(50, 150),
                "hit_type": random.choice(["paddle", "wall", "powerup"]),
                "action": "ball_hit"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Power-up used",
                "request_id": request_id,
                "match_id": match_id,
                "game_id": game_id,
                "event_type": "power_up_used",
                "player": player1["username"],
                "powerup_type": random.choice(["speed_boost", "large_paddle", "slow_ball", "multi_ball"]),
                "action": "powerup_use"
            },
            {
                "timestamp": self.get_timestamp(),
                "level": "INFO",
                "service": "game-service",
                "message": "Match ended",
                "request_id": request_id,
                "match_id": match_id,
                "game_id": game_id,
                "event_type": "match_ended",
                "winner": player1["username"],
                "loser": player2["username"],
                "final_score": f"{random.randint(5, 10)}-{random.randint(0, 4)}",
                "duration": random.randint(120, 900),
                "action": "match_end"
            }
        ]
        
        log_entry = random.choice(event_patterns)
        self.write_log("events/match-events.log", log_entry)
    
    def generate_logs_continuously(self, duration_seconds: int = 300):
        """Generate logs continuously for the specified duration"""
        start_time = time.time()
        
        print(f"Starting log generation for {duration_seconds} seconds...")
        print(f"Logs will be written to: {self.log_base_path}")
        
        while time.time() - start_time < duration_seconds:
            # Generate different types of logs with different frequencies
            
            # General game logs (most frequent)
            if random.random() < 0.4:
                self.generate_general_game_log()
            
            # Game events (frequent)
            if random.random() < 0.3:
                self.generate_game_events_log()
            
            # Match events (frequent)
            if random.random() < 0.3:
                self.generate_match_events_log()
            
            # Error logs (less frequent)
            if random.random() < 0.1:
                self.generate_game_error_log()
            
            # Wait between log generations
            time.sleep(random.uniform(0.5, 2.0))
        
        print("Log generation completed!")
    
    def generate_batch_logs(self, num_logs: int = 100):
        """Generate a batch of logs quickly"""
        print(f"Generating {num_logs} log entries...")
        
        for i in range(num_logs):
            log_type = random.choice(['general', 'events', 'match', 'error'])
            
            if log_type == 'general':
                self.generate_general_game_log()
            elif log_type == 'events':
                self.generate_game_events_log()
            elif log_type == 'match':
                self.generate_match_events_log()
            elif log_type == 'error':
                self.generate_game_error_log()
            
            if (i + 1) % 25 == 0:
                print(f"Generated {i + 1} logs...")
        
        print("Batch log generation completed!")

def main():
    """Main function to run the log generator"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate game service logs for ft-transcendence')
    parser.add_argument('--path', default='/var/log/ft-transcendence/game-service', 
                       help='Base path for log files')
    parser.add_argument('--duration', type=int, default=300, 
                       help='Duration to generate logs in seconds (default: 300)')
    parser.add_argument('--batch', type=int, help='Generate a batch of N logs and exit')
    parser.add_argument('--continuous', action='store_true', 
                       help='Generate logs continuously')
    
    args = parser.parse_args()
    
    generator = GameServiceLogGenerator(args.path)
    
    if args.batch:
        generator.generate_batch_logs(args.batch)
    elif args.continuous:
        try:
            generator.generate_logs_continuously(args.duration)
        except KeyboardInterrupt:
            print("\nLog generation stopped by user.")
    else:
        # Default: generate a small batch
        generator.generate_batch_logs(50)

if __name__ == "__main__":
    main()
