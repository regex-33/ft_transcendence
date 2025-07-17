#!/usr/bin/env python3
"""
File Service Log Generator for ft-transcendence
Generates realistic logs for file uploads, downloads, and operations
"""

import json
import logging
import random
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import threading
import sys
import os

class FileServiceLogger:
    def __init__(self, log_dir: str = "/var/log/ft-transcendence/file-service"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Setup loggers
        self.setup_loggers()
        
        # Sample data for realistic logs
        self.file_types = [
            'avatar.jpg', 'avatar.png', 'avatar.gif',
            'profile_banner.jpg', 'profile_banner.png',
            'game_screenshot.png', 'game_screenshot.jpg',
            'tournament_logo.png', 'tournament_banner.jpg',
            'chat_image.jpg', 'chat_image.png', 'chat_image.gif',
            'document.pdf', 'document.doc', 'document.txt',
            'video.mp4', 'video.avi', 'video.mov',
            'audio.mp3', 'audio.wav', 'audio.ogg'
        ]
        
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
            'Mozilla/5.0 (Android 12; Mobile; rv:104.0) Gecko/104.0 Firefox/104.0'
        ]
        
        self.ip_addresses = [
            '192.168.1.100', '192.168.1.101', '192.168.1.102',
            '10.0.0.50', '10.0.0.51', '10.0.0.52',
            '172.16.0.10', '172.16.0.11', '172.16.0.12'
        ]
        
        self.usernames = [
            'player1', 'player2', 'gamer123', 'pro_player',
            'tournament_admin', 'chat_moderator', 'user_admin',
            'game_master', 'pong_champion', 'rookie_player'
        ]
        
        self.error_types = [
            'file_too_large', 'invalid_file_type', 'storage_full',
            'permission_denied', 'file_corrupted', 'upload_timeout',
            'virus_detected', 'invalid_filename', 'quota_exceeded',
            'network_error', 'database_error', 'auth_failed'
        ]
        
        self.running = False
        
    def setup_loggers(self):
        """Setup separate loggers for different log types"""
        # Main file service logger
        self.file_logger = logging.getLogger('file_service')
        self.file_logger.setLevel(logging.INFO)
        
        file_handler = logging.FileHandler(self.log_dir / 'file.log')
        file_handler.setFormatter(logging.Formatter('%(message)s'))
        self.file_logger.addHandler(file_handler)
        
        # Error logger
        self.error_logger = logging.getLogger('file_service_error')
        self.error_logger.setLevel(logging.ERROR)
        
        error_handler = logging.FileHandler(self.log_dir / 'file-error.log')
        error_handler.setFormatter(logging.Formatter('%(message)s'))
        self.error_logger.addHandler(error_handler)
        
        # Prevent duplicate logs in console
        self.file_logger.propagate = False
        self.error_logger.propagate = False
    
    def generate_request_id(self) -> str:
        """Generate a unique request ID"""
        return f"req_{uuid.uuid4().hex[:12]}"
    
    def generate_file_id(self) -> str:
        """Generate a unique file ID"""
        return f"file_{uuid.uuid4().hex[:16]}"
    
    def generate_upload_log(self) -> Dict:
        """Generate file upload log entry"""
        request_id = self.generate_request_id()
        file_id = self.generate_file_id()
        username = random.choice(self.usernames)
        filename = f"{random.choice(['avatar', 'banner', 'screenshot', 'document'])}_{random.randint(1, 999)}.{random.choice(['jpg', 'png', 'pdf', 'mp4'])}"
        file_size = random.randint(1024, 50 * 1024 * 1024)  # 1KB to 50MB
        
        success = random.choices([True, False], weights=[85, 15])[0]
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": "INFO" if success else "ERROR",
            "service": "file-service",
            "message": f"File upload {'completed' if success else 'failed'}: {filename}",
            "request_id": request_id,
            "user_id": f"user_{random.randint(1, 1000)}",
            "username": username,
            "session_id": f"session_{uuid.uuid4().hex[:8]}",
            "action": "file_upload",
            "success": success,
            "file_id": file_id,
            "filename": filename,
            "file_size": file_size,
            "file_type": filename.split('.')[-1],
            "storage_path": f"/storage/files/{file_id[:2]}/{file_id[2:4]}/{file_id}",
            "request": {
                "method": "POST",
                "url": f"/api/files/upload",
                "ip": random.choice(self.ip_addresses),
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": 200 if success else random.choice([400, 413, 500, 507]),
                "duration": random.uniform(0.1, 5.0),
                "bytes_processed": file_size if success else random.randint(0, file_size)
            }
        }
        
        if not success:
            log_entry["error"] = random.choice(self.error_types)
            log_entry["error_reason"] = self.get_error_reason(log_entry["error"])
            log_entry["error_code"] = f"FILE_{random.randint(1000, 9999)}"
        
        return log_entry
    
    def generate_download_log(self) -> Dict:
        """Generate file download log entry"""
        request_id = self.generate_request_id()
        file_id = self.generate_file_id()
        username = random.choice(self.usernames)
        filename = random.choice(self.file_types)
        
        success = random.choices([True, False], weights=[90, 10])[0]
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": "INFO" if success else "ERROR",
            "service": "file-service",
            "message": f"File download {'completed' if success else 'failed'}: {filename}",
            "request_id": request_id,
            "user_id": f"user_{random.randint(1, 1000)}",
            "username": username,
            "session_id": f"session_{uuid.uuid4().hex[:8]}",
            "action": "file_download",
            "success": success,
            "file_id": file_id,
            "filename": filename,
            "file_size": random.randint(1024, 10 * 1024 * 1024),
            "request": {
                "method": "GET",
                "url": f"/api/files/{file_id}/download",
                "ip": random.choice(self.ip_addresses),
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": 200 if success else random.choice([404, 403, 500]),
                "duration": random.uniform(0.05, 2.0)
            }
        }
        
        if not success:
            log_entry["error"] = random.choice(['file_not_found', 'access_denied', 'storage_error'])
            log_entry["error_reason"] = self.get_error_reason(log_entry["error"])
            log_entry["error_code"] = f"DOWNLOAD_{random.randint(1000, 9999)}"
        
        return log_entry
    
    def generate_delete_log(self) -> Dict:
        """Generate file deletion log entry"""
        request_id = self.generate_request_id()
        file_id = self.generate_file_id()
        username = random.choice(self.usernames)
        
        success = random.choices([True, False], weights=[95, 5])[0]
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": "INFO" if success else "ERROR",
            "service": "file-service",
            "message": f"File deletion {'completed' if success else 'failed'}",
            "request_id": request_id,
            "user_id": f"user_{random.randint(1, 1000)}",
            "username": username,
            "session_id": f"session_{uuid.uuid4().hex[:8]}",
            "action": "file_delete",
            "success": success,
            "file_id": file_id,
            "request": {
                "method": "DELETE",
                "url": f"/api/files/{file_id}",
                "ip": random.choice(self.ip_addresses),
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": 200 if success else random.choice([404, 403, 500]),
                "duration": random.uniform(0.02, 0.5)
            }
        }
        
        if not success:
            log_entry["error"] = random.choice(['file_not_found', 'permission_denied', 'storage_error'])
            log_entry["error_reason"] = self.get_error_reason(log_entry["error"])
            log_entry["error_code"] = f"DELETE_{random.randint(1000, 9999)}"
        
        return log_entry
    
    def generate_metadata_log(self) -> Dict:
        """Generate file metadata operation log"""
        request_id = self.generate_request_id()
        file_id = self.generate_file_id()
        username = random.choice(self.usernames)
        
        actions = ['get_metadata', 'update_metadata', 'list_files']
        action = random.choice(actions)
        
        success = random.choices([True, False], weights=[92, 8])[0]
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": "INFO" if success else "ERROR",
            "service": "file-service",
            "message": f"File metadata operation {action} {'completed' if success else 'failed'}",
            "request_id": request_id,
            "user_id": f"user_{random.randint(1, 1000)}",
            "username": username,
            "session_id": f"session_{uuid.uuid4().hex[:8]}",
            "action": action,
            "success": success,
            "file_id": file_id if action != 'list_files' else None,
            "request": {
                "method": "GET" if action in ['get_metadata', 'list_files'] else "PUT",
                "url": f"/api/files/{file_id}/metadata" if action != 'list_files' else "/api/files",
                "ip": random.choice(self.ip_addresses),
                "user_agent": random.choice(self.user_agents)
            },
            "response": {
                "status": 200 if success else random.choice([404, 403, 500]),
                "duration": random.uniform(0.01, 0.3)
            }
        }
        
        if action == 'list_files':
            log_entry["files_count"] = random.randint(0, 500)
        
        if not success:
            log_entry["error"] = random.choice(['file_not_found', 'database_error', 'invalid_metadata'])
            log_entry["error_reason"] = self.get_error_reason(log_entry["error"])
            log_entry["error_code"] = f"META_{random.randint(1000, 9999)}"
        
        return log_entry
    
    def generate_system_log(self) -> Dict:
        """Generate system-level file service logs"""
        events = [
            'storage_cleanup', 'quota_check', 'backup_started', 'backup_completed',
            'virus_scan_started', 'virus_scan_completed', 'cache_cleanup',
            'storage_health_check', 'database_connection_check'
        ]
        
        event = random.choice(events)
        success = random.choices([True, False], weights=[95, 5])[0]
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": "INFO" if success else "ERROR",
            "service": "file-service",
            "message": f"System event: {event} {'completed' if success else 'failed'}",
            "request_id": self.generate_request_id(),
            "action": event,
            "success": success,
            "event_type": "system",
            "duration": random.uniform(0.1, 30.0)
        }
        
        if event == 'storage_cleanup':
            log_entry["files_cleaned"] = random.randint(0, 100)
            log_entry["space_freed"] = random.randint(0, 1000000000)  # bytes
        elif event == 'quota_check':
            log_entry["users_checked"] = random.randint(100, 1000)
            log_entry["quota_violations"] = random.randint(0, 10)
        elif event in ['backup_started', 'backup_completed']:
            log_entry["backup_id"] = f"backup_{uuid.uuid4().hex[:8]}"
            log_entry["files_processed"] = random.randint(1000, 10000)
        elif event in ['virus_scan_started', 'virus_scan_completed']:
            log_entry["scan_id"] = f"scan_{uuid.uuid4().hex[:8]}"
            log_entry["files_scanned"] = random.randint(100, 1000)
            if event == 'virus_scan_completed':
                log_entry["threats_found"] = random.randint(0, 3)
        
        if not success:
            log_entry["error"] = random.choice(['storage_error', 'database_error', 'network_error'])
            log_entry["error_reason"] = self.get_error_reason(log_entry["error"])
            log_entry["error_code"] = f"SYS_{random.randint(1000, 9999)}"
        
        return log_entry
    
    def get_error_reason(self, error_type: str) -> str:
        """Get human-readable error reason"""
        error_reasons = {
            'file_too_large': 'File size exceeds maximum allowed limit',
            'invalid_file_type': 'File type not supported',
            'storage_full': 'Storage capacity exceeded',
            'permission_denied': 'User lacks required permissions',
            'file_corrupted': 'File appears to be corrupted',
            'upload_timeout': 'Upload operation timed out',
            'virus_detected': 'Malicious content detected',
            'invalid_filename': 'Filename contains invalid characters',
            'quota_exceeded': 'User storage quota exceeded',
            'network_error': 'Network connectivity issues',
            'database_error': 'Database operation failed',
            'auth_failed': 'Authentication failed',
            'file_not_found': 'Requested file does not exist',
            'access_denied': 'Access to file denied',
            'storage_error': 'Storage system error',
            'invalid_metadata': 'Invalid metadata format'
        }
        return error_reasons.get(error_type, 'Unknown error')
    
    def write_log(self, log_entry: Dict):
        """Write log entry to appropriate log file"""
        log_json = json.dumps(log_entry, ensure_ascii=False)
        
        if log_entry["level"] == "ERROR":
            self.error_logger.error(log_json)
        else:
            self.file_logger.info(log_json)
    
    def generate_logs_continuously(self, interval: float = 1.0):
        """Generate logs continuously"""
        self.running = True
        
        while self.running:
            try:
                # Generate different types of logs with different probabilities
                log_type = random.choices(
                    ['upload', 'download', 'delete', 'metadata', 'system'],
                    weights=[40, 30, 10, 15, 5]
                )[0]
                
                if log_type == 'upload':
                    log_entry = self.generate_upload_log()
                elif log_type == 'download':
                    log_entry = self.generate_download_log()
                elif log_type == 'delete':
                    log_entry = self.generate_delete_log()
                elif log_type == 'metadata':
                    log_entry = self.generate_metadata_log()
                else:  # system
                    log_entry = self.generate_system_log()
                
                self.write_log(log_entry)
                
                # Add some randomness to interval
                sleep_time = interval + random.uniform(-0.3, 0.3)
                time.sleep(max(0.1, sleep_time))
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error generating logs: {e}")
                time.sleep(1)
    
    def stop(self):
        """Stop log generation"""
        self.running = False
    
    def generate_batch_logs(self, count: int = 100):
        """Generate a batch of logs"""
        print(f"Generating {count} log entries...")
        
        for i in range(count):
            log_type = random.choices(
                ['upload', 'download', 'delete', 'metadata', 'system'],
                weights=[40, 30, 10, 15, 5]
            )[0]
            
            if log_type == 'upload':
                log_entry = self.generate_upload_log()
            elif log_type == 'download':
                log_entry = self.generate_download_log()
            elif log_type == 'delete':
                log_entry = self.generate_delete_log()
            elif log_type == 'metadata':
                log_entry = self.generate_metadata_log()
            else:  # system
                log_entry = self.generate_system_log()
            
            self.write_log(log_entry)
            
            if (i + 1) % 10 == 0:
                print(f"Generated {i + 1}/{count} logs")
        
        print(f"✅ Generated {count} log entries successfully!")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='File Service Log Generator')
    parser.add_argument('--log-dir', default='/var/log/ft-transcendence/file-service',
                        help='Directory to write log files')
    parser.add_argument('--interval', type=float, default=1.0,
                        help='Interval between log entries (seconds)')
    parser.add_argument('--batch', type=int, help='Generate batch of logs and exit')
    parser.add_argument('--continuous', action='store_true',
                        help='Generate logs continuously')
    
    args = parser.parse_args()
    
    logger = FileServiceLogger(args.log_dir)
    
    if args.batch:
        logger.generate_batch_logs(args.batch)
    elif args.continuous:
        print(f"Starting continuous log generation (interval: {args.interval}s)")
        print("Press Ctrl+C to stop...")
        try:
            logger.generate_logs_continuously(args.interval)
        except KeyboardInterrupt:
            print("\nStopping log generation...")
            logger.stop()
    else:
        # Default: generate a small batch
        logger.generate_batch_logs(50)

if __name__ == '__main__':
    main()
