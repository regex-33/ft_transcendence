#!/usr/bin/env python3
"""
Chat Service Log Generator for ft-transcendence
Generates realistic logs that match the ELK stack configuration
"""

import json
import random
import time
import datetime
import uuid
import threading
from pathlib import Path
from typing import Dict, List, Optional
import logging
from dataclasses import dataclass
from enum import Enum

class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    FATAL = "FATAL"

class EventType(Enum):
    USER_JOIN = "user_join"
    USER_LEAVE = "user_leave"
    MESSAGE_SENT = "message_sent"
    MESSAGE_RECEIVED = "message_received"
    ROOM_CREATED = "room_created"
    ROOM_DELETED = "room_deleted"
    CONNECTION_ESTABLISHED = "connection_established"
    CONNECTION_LOST = "connection_lost"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    RATE_LIMIT = "rate_limit"
    SPAM_DETECTED = "spam_detected"
    MODERATION_ACTION = "moderation_action"

@dataclass
class User:
    user_id: str
    username: str
    session_id: str
    ip_address: str
    user_agent: str

@dataclass
class Room:
    room_id: str
    channel_id: str
    name: str
    participants: List[str]
    created_at: datetime.datetime

class ChatLogGenerator:
    def __init__(self, log_dir: str = "/var/log/ft-transcendence/chat-service"):
        self.log_dir = Path(log_dir)
        self.setup_directories()
        
        # Sample data
        self.users = self._generate_sample_users()
        self.rooms = self._generate_sample_rooms()
        self.message_templates = self._load_message_templates()
        self.user_agents = self._load_user_agents()
        
        # Active sessions
        self.active_sessions: Dict[str, User] = {}
        self.active_rooms: Dict[str, Room] = {}
        
        # Counters
        self.message_counter = 0
        self.error_counter = 0
        
        # Threading control
        self.running = False
        self.threads = []

    def setup_directories(self):
        """Create log directories if they don't exist"""
        self.log_dir.mkdir(parents=True, exist_ok=True)
        (self.log_dir / "messages").mkdir(exist_ok=True)
        
        # Create log files
        for log_file in ["chat.log", "chat-error.log", "messages/messages.log", "messages/messages-archive.log"]:
            (self.log_dir / log_file).touch()

    def _generate_sample_users(self) -> List[User]:
        """Generate sample users for simulation"""
        usernames = ["alice", "bob", "charlie", "diana", "eve", "frank", "grace", "henry", "iris", "jack"]
        users = []
        
        for username in usernames:
            user = User(
                user_id=f"user_{random.randint(1000, 9999)}",
                username=username,
                session_id=str(uuid.uuid4()),
                ip_address=f"192.168.1.{random.randint(1, 254)}",
                user_agent=random.choice(self._load_user_agents())
            )
            users.append(user)
        
        return users

    def _generate_sample_rooms(self) -> List[Room]:
        """Generate sample chat rooms"""
        room_names = ["general", "random", "gaming", "help", "announcements", "off-topic"]
        rooms = []
        
        for room_name in room_names:
            room = Room(
                room_id=f"room_{random.randint(1000, 9999)}",
                channel_id=f"channel_{random.randint(100, 999)}",
                name=room_name,
                participants=[],
                created_at=datetime.datetime.now()
            )
            rooms.append(room)
        
        return rooms

    def _load_message_templates(self) -> List[str]:
        """Load message templates for realistic chat simulation"""
        return [
            "Hello everyone!",
            "How's the game going?",
            "Anyone want to play pong?",
            "Good game!",
            "Nice shot!",
            "Thanks for the match",
            "See you later",
            "What's your best score?",
            "This is fun!",
            "Ready for another round?",
            "gg wp",
            "That was close!",
            "Good luck everyone",
            "Anyone online?",
            "Let's start a tournament",
            "Who wants to challenge me?",
            "Nice moves!",
            "Almost had it!",
            "One more game?",
            "Congratulations!"
        ]

    def _load_user_agents(self) -> List[str]:
        """Load realistic user agent strings"""
        return [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
            "Mozilla/5.0 (Android 10; Mobile; rv:81.0) Gecko/81.0 Firefox/81.0"
        ]

    def generate_request_id(self) -> str:
        """Generate unique request ID"""
        return f"req_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"

    def get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.datetime.now().isoformat() + "Z"

    def create_log_entry(self, level: LogLevel, message: str, **kwargs) -> Dict:
        """Create a standardized log entry"""
        log_entry = {
            "timestamp": self.get_timestamp(),
            "level": level.value,
            "service": "chat-service",
            "message": message,
            "request_id": self.generate_request_id(),
            **kwargs
        }
        return log_entry

    def write_log(self, log_file: str, entry: Dict):
        """Write log entry to file"""
        log_path = self.log_dir / log_file
        with open(log_path, 'a') as f:
            f.write(json.dumps(entry) + '\n')

    def generate_user_join_event(self):
        """Generate user join event"""
        user = random.choice(self.users)
        room = random.choice(self.rooms)
        
        # Add to active sessions
        self.active_sessions[user.session_id] = user
        if room.room_id not in self.active_rooms:
            self.active_rooms[room.room_id] = room
        
        if user.user_id not in room.participants:
            room.participants.append(user.user_id)

        # Main chat log
        log_entry = self.create_log_entry(
            LogLevel.INFO,
            f"User {user.username} joined room {room.name}",
            user_id=user.user_id,
            username=user.username,
            session_id=user.session_id,
            room_id=room.room_id,
            channel_id=room.channel_id,
            action="user_join",
            success=True,
            event_type=EventType.USER_JOIN.value,
            request={
                "ip": user.ip_address,
                "user_agent": user.user_agent,
                "method": "POST",
                "url": f"/api/chat/rooms/{room.room_id}/join"
            },
            response={
                "status": 200,
                "time": random.uniform(0.01, 0.1),
                "duration": random.uniform(0.005, 0.05)
            }
        )
        self.write_log("chat.log", log_entry)

        # Message log
        message_entry = self.create_log_entry(
            LogLevel.INFO,
            f"System message: {user.username} joined the room",
            user_id="system",
            username="system",
            room_id=room.room_id,
            channel_id=room.channel_id,
            message_id=str(uuid.uuid4()),
            event_type="system_message",
            message_type="join_notification"
        )
        self.write_log("messages/messages.log", message_entry)

    def generate_user_leave_event(self):
        """Generate user leave event"""
        if not self.active_sessions:
            return
            
        session_id = random.choice(list(self.active_sessions.keys()))
        user = self.active_sessions[session_id]
        
        # Find room user is in
        user_room = None
        for room in self.active_rooms.values():
            if user.user_id in room.participants:
                user_room = room
                break
        
        if not user_room:
            return

        # Remove from room
        room.participants.remove(user.user_id)
        del self.active_sessions[session_id]

        log_entry = self.create_log_entry(
            LogLevel.INFO,
            f"User {user.username} left room {user_room.name}",
            user_id=user.user_id,
            username=user.username,
            session_id=user.session_id,
            room_id=user_room.room_id,
            channel_id=user_room.channel_id,
            action="user_leave",
            success=True,
            event_type=EventType.USER_LEAVE.value,
            request={
                "ip": user.ip_address,
                "user_agent": user.user_agent,
                "method": "POST",
                "url": f"/api/chat/rooms/{user_room.room_id}/leave"
            },
            response={
                "status": 200,
                "time": random.uniform(0.01, 0.1)
            }
        )
        self.write_log("chat.log", log_entry)

    def generate_message_sent_event(self):
        """Generate message sent event"""
        if not self.active_sessions:
            return
            
        user = random.choice(list(self.active_sessions.values()))
        
        # Find room user is in
        user_room = None
        for room in self.active_rooms.values():
            if user.user_id in room.participants:
                user_room = room
                break
        
        if not user_room:
            return

        message_id = str(uuid.uuid4())
        message_text = random.choice(self.message_templates)
        self.message_counter += 1

        # Main chat log
        log_entry = self.create_log_entry(
            LogLevel.INFO,
            f"Message sent by {user.username} in room {user_room.name}",
            user_id=user.user_id,
            username=user.username,
            session_id=user.session_id,
            room_id=user_room.room_id,
            channel_id=user_room.channel_id,
            message_id=message_id,
            action="message_sent",
            success=True,
            event_type=EventType.MESSAGE_SENT.value,
            request={
                "ip": user.ip_address,
                "user_agent": user.user_agent,
                "method": "POST",
                "url": f"/api/chat/rooms/{user_room.room_id}/messages"
            },
            response={
                "status": 201,
                "time": random.uniform(0.02, 0.15),
                "duration": random.uniform(0.01, 0.08)
            }
        )
        self.write_log("chat.log", log_entry)

        # Message log
        message_entry = self.create_log_entry(
            LogLevel.INFO,
            message_text,
            user_id=user.user_id,
            username=user.username,
            room_id=user_room.room_id,
            channel_id=user_room.channel_id,
            message_id=message_id,
            event_type="user_message",
            message_type="text",
            message_content=message_text,
            message_length=len(message_text)
        )
        self.write_log("messages/messages.log", message_entry)

    def generate_connection_event(self):
        """Generate WebSocket connection events"""
        user = random.choice(self.users)
        
        if random.choice([True, False]):  # Connection established
            log_entry = self.create_log_entry(
                LogLevel.INFO,
                f"WebSocket connection established for user {user.username}",
                user_id=user.user_id,
                username=user.username,
                session_id=user.session_id,
                action="websocket_connect",
                success=True,
                event_type=EventType.CONNECTION_ESTABLISHED.value,
                request={
                    "ip": user.ip_address,
                    "user_agent": user.user_agent,
                    "method": "GET",
                    "url": "/ws/chat"
                },
                response={
                    "status": 101,
                    "time": random.uniform(0.001, 0.01)
                }
            )
        else:  # Connection lost
            log_entry = self.create_log_entry(
                LogLevel.WARN,
                f"WebSocket connection lost for user {user.username}",
                user_id=user.user_id,
                username=user.username,
                session_id=user.session_id,
                action="websocket_disconnect",
                success=False,
                event_type=EventType.CONNECTION_LOST.value,
                error_reason="connection_timeout",
                request={
                    "ip": user.ip_address,
                    "user_agent": user.user_agent
                }
            )
        
        self.write_log("chat.log", log_entry)

    def generate_error_event(self):
        """Generate error events"""
        user = random.choice(self.users)
        error_types = [
            ("rate_limit_exceeded", "Rate limit exceeded for user", 429),
            ("message_too_long", "Message exceeds maximum length", 400),
            ("room_not_found", "Chat room not found", 404),
            ("unauthorized_access", "Unauthorized access to room", 403),
            ("database_error", "Database connection failed", 500),
            ("validation_error", "Invalid message format", 400),
            ("spam_detected", "Spam message detected", 400)
        ]
        
        error_code, error_message, status_code = random.choice(error_types)
        self.error_counter += 1

        log_entry = self.create_log_entry(
            LogLevel.ERROR,
            f"Chat service error: {error_message}",
            user_id=user.user_id,
            username=user.username,
            session_id=user.session_id,
            action="error_occurred",
            success=False,
            error_code=error_code,
            error_message=error_message,
            error_reason=error_code,
            event_type="error",
            request={
                "ip": user.ip_address,
                "user_agent": user.user_agent,
                "method": "POST",
                "url": "/api/chat/messages"
            },
            response={
                "status": status_code,
                "time": random.uniform(0.001, 0.05)
            }
        )
        self.write_log("chat-error.log", log_entry)

    def generate_security_event(self):
        """Generate security-related events"""
        user = random.choice(self.users)
        
        security_events = [
            ("failed_authentication", "Authentication failed", "medium"),
            ("suspicious_activity", "Unusual message pattern detected", "high"),
            ("rate_limit_violation", "Rate limit violation detected", "medium"),
            ("spam_attempt", "Spam message blocked", "low"),
            ("unauthorized_room_access", "Unauthorized room access attempt", "high")
        ]
        
        event_type, message, threat_level = random.choice(security_events)

        log_entry = self.create_log_entry(
            LogLevel.WARN,
            f"Security event: {message}",
            user_id=user.user_id,
            username=user.username,
            session_id=user.session_id,
            action="security_event",
            success=False,
            security_event=event_type,
            threat_level=threat_level,
            source_ip=user.ip_address,
            event_type="security",
            request={
                "ip": user.ip_address,
                "user_agent": user.user_agent,
                "method": "POST",
                "url": "/api/chat/rooms/restricted"
            },
            response={
                "status": 403,
                "time": random.uniform(0.001, 0.02)
            }
        )
        self.write_log("chat.log", log_entry)

    def archive_messages(self):
        """Periodically archive old messages"""
        archive_entry = self.create_log_entry(
            LogLevel.INFO,
            f"Archived {random.randint(50, 200)} old messages",
            action="message_archival",
            success=True,
            event_type="maintenance",
            archived_count=random.randint(50, 200),
            archive_date=self.get_timestamp()
        )
        self.write_log("messages/messages-archive.log", archive_entry)

    def generate_stats_log(self):
        """Generate periodic statistics"""
        stats_entry = self.create_log_entry(
            LogLevel.INFO,
            "Chat service statistics",
            action="stats_report",
            success=True,
            event_type="statistics",
            active_users=len(self.active_sessions),
            active_rooms=len(self.active_rooms),
            messages_sent=self.message_counter,
            errors_occurred=self.error_counter,
            uptime_seconds=random.randint(3600, 86400)
        )
        self.write_log("chat.log", stats_entry)

    def log_generation_worker(self):
        """Worker thread for generating logs"""
        while self.running:
            try:
                # Generate different types of events with varying probabilities
                event_type = random.choices(
                    [
                        self.generate_message_sent_event,
                        self.generate_user_join_event,
                        self.generate_user_leave_event,
                        self.generate_connection_event,
                        self.generate_error_event,
                        self.generate_security_event,
                        self.archive_messages,
                        self.generate_stats_log
                    ],
                    weights=[40, 10, 8, 15, 12, 8, 2, 5]
                )[0]
                
                event_type()
                
                # Random delay between events
                time.sleep(random.uniform(0.1, 3.0))
                
            except Exception as e:
                print(f"Error in log generation worker: {e}")
                time.sleep(1)

    def start(self, num_workers: int = 2):
        """Start log generation with multiple workers"""
        print(f"Starting chat service log generation...")
        print(f"Log directory: {self.log_dir}")
        print(f"Workers: {num_workers}")
        
        self.running = True
        
        # Start worker threads
        for i in range(num_workers):
            thread = threading.Thread(target=self.log_generation_worker, daemon=True)
            thread.start()
            self.threads.append(thread)
        
        # Initialize some users in rooms
        for _ in range(5):
            self.generate_user_join_event()
        
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping log generation...")
            self.stop()

    def stop(self):
        """Stop log generation"""
        self.running = False
        for thread in self.threads:
            thread.join(timeout=1)
        print("Log generation stopped.")

    def generate_batch(self, count: int = 100):
        """Generate a batch of logs for testing"""
        print(f"Generating {count} log entries...")
        
        # Initialize some users
        for _ in range(3):
            self.generate_user_join_event()
        
        for i in range(count):
            event_type = random.choices(
                [
                    self.generate_message_sent_event,
                    self.generate_user_join_event,
                    self.generate_user_leave_event,
                    self.generate_connection_event,
                    self.generate_error_event,
                    self.generate_security_event
                ],
                weights=[50, 10, 8, 15, 12, 5]
            )[0]
            
            event_type()
            
            if i % 10 == 0:
                print(f"Generated {i + 1}/{count} logs")
        
        print(f"Batch generation complete!")
        print(f"Messages sent: {self.message_counter}")
        print(f"Errors occurred: {self.error_counter}")
        print(f"Active sessions: {len(self.active_sessions)}")

def main():
    """Main function to run the log generator"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Chat Service Log Generator")
    parser.add_argument("--log-dir", default="/var/log/ft-transcendence/chat-service", 
                       help="Log directory path")
    parser.add_argument("--batch", type=int, help="Generate batch of N logs and exit")
    parser.add_argument("--workers", type=int, default=2, help="Number of worker threads")
    
    args = parser.parse_args()
    
    generator = ChatLogGenerator(args.log_dir)
    
    if args.batch:
        generator.generate_batch(args.batch)
    else:
        generator.start(args.workers)

if __name__ == "__main__":
    main()
