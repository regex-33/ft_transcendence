#!/usr/bin/env python3
"""
Chat Messages Log Generator for ft-transcendence
Generates realistic chat message logs that match the ELK stack configuration
"""

import json
import random
import time
import datetime
import os
import sys
import threading
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from uuid import uuid4
from pathlib import Path

@dataclass
class ChatMessage:
    """Represents a chat message structure"""
    timestamp: str
    level: str
    message: str
    service: str
    request_id: str
    user_id: str
    username: str
    session_id: str
    action: str
    success: bool
    message_id: str
    channel_id: str
    room_id: str
    event_type: str
    request: Optional[Dict] = None
    response: Optional[Dict] = None
    error: Optional[str] = None
    error_reason: Optional[str] = None
    error_code: Optional[str] = None

class ChatLogGenerator:
    """Generates realistic chat message logs for ft-transcendence"""
    
    def __init__(self, log_dir: str = "/var/log/ft-transcendence/chat-messages"):
        self.log_dir = Path(log_dir)
        self.log_file = self.log_dir / "chat-messages.log"
        self.archive_file = self.log_dir / "chat-messages-archive.log"
        
        # Sample data for realistic log generation
        self.usernames = [
            "alice_42", "bob_gamer", "charlie_dev", "diana_pro", "eve_ninja",
            "frank_master", "grace_coder", "henry_player", "iris_champion", "jack_warrior",
            "kate_legend", "luke_hero", "mia_expert", "noah_ace", "olivia_star",
            "peter_fox", "quinn_wolf", "ruby_phoenix", "sam_dragon", "tina_eagle"
        ]
        
        self.channels = [
            "general", "game-lobby", "tournament", "support", "random",
            "dev-chat", "announcements", "feedback", "off-topic", "strategies"
        ]
        
        self.rooms = [
            "lobby-1", "lobby-2", "tournament-room-1", "tournament-room-2",
            "private-room-1", "private-room-2", "game-room-1", "game-room-2",
            "waiting-room", "vip-room"
        ]
        
        self.actions = [
            "send_message", "join_channel", "leave_channel", "create_room",
            "join_room", "leave_room", "delete_message", "edit_message",
            "react_to_message", "mention_user", "share_file", "send_emoji"
        ]
        
        self.event_types = [
            "message_sent", "message_received", "user_joined", "user_left",
            "room_created", "room_deleted", "message_deleted", "message_edited",
            "user_mentioned", "file_shared", "emoji_reaction", "typing_indicator"
        ]
        
        self.sample_messages = [
            "Hey everyone! Ready for the tournament?",
            "Good game! That was intense!",
            "Anyone up for a quick match?",
            "The new update looks amazing!",
            "GG, well played everyone",
            "Looking for teammates for the next round",
            "Check out this cool strategy I found",
            "The servers seem a bit laggy today",
            "Congratulations on the victory!",
            "Thanks for the helpful tips!",
            "Let's practice together tomorrow",
            "This game mode is really fun",
            "Who wants to join our team?",
            "Great match, see you next time!",
            "The graphics in this game are incredible",
            "Anyone know when the next tournament starts?",
            "I'm streaming the match if anyone wants to watch",
            "Just hit level 50! Finally!",
            "This boss fight is really challenging",
            "Love the new character designs"
        ]
        
        self.error_messages = [
            "Message failed to send",
            "User not found in channel",
            "Permission denied",
            "Rate limit exceeded",
            "Channel is full",
            "Message too long",
            "Invalid characters in message",
            "User is muted",
            "Channel is read-only",
            "Connection timeout"
        ]
        
        self.error_codes = [
            "SEND_FAILED", "USER_NOT_FOUND", "PERMISSION_DENIED",
            "RATE_LIMITED", "CHANNEL_FULL", "MESSAGE_TOO_LONG",
            "INVALID_CONTENT", "USER_MUTED", "READ_ONLY", "TIMEOUT"
        ]
        
        # Create directory if it doesn't exist
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize log files
        self.log_file.touch(exist_ok=True)
        self.archive_file.touch(exist_ok=True)
    
    def generate_timestamp(self) -> str:
        """Generate ISO timestamp"""
        return datetime.datetime.now().isoformat() + "Z"
    
    def generate_id(self) -> str:
        """Generate UUID"""
        return str(uuid4())
    
    def generate_user_id(self) -> str:
        """Generate user ID"""
        return f"user_{random.randint(1000, 9999)}"
    
    def generate_session_id(self) -> str:
        """Generate session ID"""
        return f"sess_{self.generate_id()[:8]}"
    
    def generate_request_data(self, action: str) -> Dict:
        """Generate request data based on action"""
        base_request = {
            "method": "POST",
            "url": f"/api/v1/chat/{action}",
            "ip": f"192.168.1.{random.randint(100, 254)}",
            "user_agent": random.choice([
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
            ])
        }
        
        if action == "send_message":
            base_request["url"] = "/api/v1/chat/messages"
        elif action == "join_channel":
            base_request["url"] = "/api/v1/chat/channels/join"
        elif action == "create_room":
            base_request["url"] = "/api/v1/chat/rooms"
        
        return base_request
    
    def generate_response_data(self, success: bool) -> Dict:
        """Generate response data"""
        if success:
            return {
                "status": random.choice([200, 201]),
                "time": round(random.uniform(0.05, 0.5), 3),
                "duration": round(random.uniform(10, 200), 2)
            }
        else:
            return {
                "status": random.choice([400, 401, 403, 404, 429, 500]),
                "time": round(random.uniform(0.1, 1.0), 3),
                "duration": round(random.uniform(50, 500), 2)
            }
    
    def generate_chat_message_log(self) -> ChatMessage:
        """Generate a single chat message log entry"""
        username = random.choice(self.usernames)
        user_id = self.generate_user_id()
        action = random.choice(self.actions)
        success = random.choice([True, True, True, True, False])  # 80% success rate
        
        log_entry = ChatMessage(
            timestamp=self.generate_timestamp(),
            level=random.choice(["INFO", "INFO", "INFO", "WARN", "ERROR"]),
            message=random.choice(self.sample_messages) if success else random.choice(self.error_messages),
            service="chat-service",
            request_id=self.generate_id(),
            user_id=user_id,
            username=username,
            session_id=self.generate_session_id(),
            action=action,
            success=success,
            message_id=self.generate_id(),
            channel_id=random.choice(self.channels),
            room_id=random.choice(self.rooms),
            event_type=random.choice(self.event_types),
            request=self.generate_request_data(action),
            response=self.generate_response_data(success)
        )
        
        # Add error details if failed
        if not success:
            log_entry.error = random.choice(self.error_messages)
            log_entry.error_reason = random.choice(self.error_messages)
            log_entry.error_code = random.choice(self.error_codes)
            log_entry.level = "ERROR"
        
        return log_entry
    
    def write_log_entry(self, log_entry: ChatMessage, archive: bool = False):
        """Write log entry to file"""
        log_dict = asdict(log_entry)
        # Remove None values
        log_dict = {k: v for k, v in log_dict.items() if v is not None}
        
        log_line = json.dumps(log_dict, separators=(',', ':'))
        
        target_file = self.archive_file if archive else self.log_file
        
        with open(target_file, 'a') as f:
            f.write(log_line + '\n')
    
    def generate_batch_logs(self, count: int = 100, archive: bool = False):
        """Generate a batch of log entries"""
        print(f"Generating {count} chat message logs...")
        
        for i in range(count):
            log_entry = self.generate_chat_message_log()
            self.write_log_entry(log_entry, archive)
            
            if (i + 1) % 10 == 0:
                print(f"Generated {i + 1}/{count} logs")
        
        target = "archive" if archive else "main"
        print(f"✓ Successfully generated {count} logs in {target} file")
    
    def generate_realtime_logs(self, interval: float = 2.0, duration: int = 300):
        """Generate logs in real-time for specified duration"""
        print(f"Starting real-time log generation for {duration} seconds...")
        print(f"Generating a log every {interval} seconds")
        
        start_time = time.time()
        count = 0
        
        while (time.time() - start_time) < duration:
            log_entry = self.generate_chat_message_log()
            self.write_log_entry(log_entry)
            count += 1
            
            if count % 10 == 0:
                print(f"Generated {count} real-time logs")
            
            time.sleep(interval)
        
        print(f"✓ Real-time generation completed. Total logs: {count}")
    
    def generate_mixed_scenario(self):
        """Generate a mixed scenario with different types of activities"""
        print("Generating mixed chat scenario...")
        
        # Normal activity
        self.generate_batch_logs(50, archive=False)
        
        # High activity period (tournament)
        print("Simulating high activity period...")
        for _ in range(20):
            log_entry = self.generate_chat_message_log()
            log_entry.channel_id = "tournament"
            log_entry.event_type = "tournament_message"
            log_entry.message = random.choice([
                "Tournament bracket updated!",
                "Next match starting in 5 minutes",
                "Great game, advancing to next round!",
                "Tournament leaderboard updated",
                "Semifinal match results posted"
            ])
            self.write_log_entry(log_entry)
        
        # Error scenario
        print("Simulating error scenario...")
        for _ in range(10):
            log_entry = self.generate_chat_message_log()
            log_entry.success = False
            log_entry.level = "ERROR"
            log_entry.error = random.choice(self.error_messages)
            log_entry.error_code = random.choice(self.error_codes)
            self.write_log_entry(log_entry)
        
        # Archive some old logs
        print("Generating archive logs...")
        self.generate_batch_logs(30, archive=True)
        
        print("✓ Mixed scenario generation completed")
    
    def display_stats(self):
        """Display statistics about generated logs"""
        main_count = 0
        archive_count = 0
        
        if self.log_file.exists():
            with open(self.log_file, 'r') as f:
                main_count = sum(1 for _ in f)
        
        if self.archive_file.exists():
            with open(self.archive_file, 'r') as f:
                archive_count = sum(1 for _ in f)
        
        print(f"\n Log Statistics:")
        print(f"Main log file: {main_count} entries")
        print(f"Archive log file: {archive_count} entries")
        print(f"Total: {main_count + archive_count} entries")
        print(f"Main log file size: {self.log_file.stat().st_size if self.log_file.exists() else 0} bytes")
        print(f"Archive log file size: {self.archive_file.stat().st_size if self.archive_file.exists() else 0} bytes")

def main():
    """Main function with CLI interface"""
    if len(sys.argv) < 2:
        print("Usage: python chat_log_generator.py <command> [options]")
        print("Commands:")
        print("  batch <count> [archive]  - Generate batch of logs")
        print("  realtime <interval> <duration> - Generate real-time logs")
        print("  mixed                    - Generate mixed scenario")
        print("  stats                    - Show log statistics")
        print("  continuous               - Run continuously")
        sys.exit(1)
    
    # Use current directory for testing, change to /var/log/ft-transcendence/chat-messages for production
    log_dir = "./logs/chat-messages"  # Change this to /var/log/ft-transcendence/chat-messages
    generator = ChatLogGenerator(log_dir)
    
    command = sys.argv[1]
    
    if command == "batch":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 100
        archive = len(sys.argv) > 3 and sys.argv[3].lower() == "archive"
        generator.generate_batch_logs(count, archive)
    
    elif command == "realtime":
        interval = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0
        duration = int(sys.argv[3]) if len(sys.argv) > 3 else 300
        generator.generate_realtime_logs(interval, duration)
    
    elif command == "mixed":
        generator.generate_mixed_scenario()
    
    elif command == "stats":
        generator.display_stats()
    
    elif command == "continuous":
        print("Running continuous log generation. Press Ctrl+C to stop.")
        try:
            while True:
                generator.generate_realtime_logs(interval=1.0, duration=60)
                time.sleep(5)
        except KeyboardInterrupt:
            print("\nStopping continuous generation...")
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
    
    generator.display_stats()

if __name__ == "__main__":
    main()
