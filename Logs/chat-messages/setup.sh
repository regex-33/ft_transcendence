#!/bin/bash
# setup_chat_logs.sh - Setup script for chat log generation

echo " Setting up ft-transcendence chat log generation..."

# Create the directory structure
LOG_DIR="/var/log/ft-transcendence/chat-messages"
LOCAL_LOG_DIR="./logs/chat-messages"

# Create local directory for testing
mkdir -p "$LOCAL_LOG_DIR"

# Create the actual log directory (requires sudo)
if [[ $EUID -ne 0 ]]; then
    echo "Creating log directory structure (requires sudo)..."
    sudo mkdir -p "$LOG_DIR"
    sudo touch "$LOG_DIR/chat-messages.log"
    sudo touch "$LOG_DIR/chat-messages-archive.log"
    sudo chown -R $USER:$USER "$LOG_DIR"
    sudo chmod 755 "$LOG_DIR"
    sudo chmod 644 "$LOG_DIR"/*.log
    echo "✓ Created $LOG_DIR with proper permissions"
else
    mkdir -p "$LOG_DIR"
    touch "$LOG_DIR/chat-messages.log"
    touch "$LOG_DIR/chat-messages-archive.log"
    echo "✓ Created $LOG_DIR"
fi

# Create requirements file
cat > requirements.txt << 'EOF'
# No external dependencies required for this script
# All modules used are part of Python standard library:
# - json
# - random
# - time
# - datetime
# - os
# - sys
# - threading
# - typing
# - dataclasses
# - uuid
# - pathlib
EOF

echo "✓ Created requirements.txt"

# Create sample usage script
cat > run_chat_logs.py << 'EOF'
#!/usr/bin/env python3
"""
Sample usage script for chat log generation
"""

import sys
import os
import time
import threading
from pathlib import Path

# Add current directory to path to import our generator
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chat_log_generator import ChatLogGenerator

def main():
    print("🎮 ft-transcendence Chat Log Generator")
    print("=====================================")
    
    # For testing, use local directory
    # For production, use: /var/log/ft-transcendence/chat-messages
    log_dir = "./logs/chat-messages"
    generator = ChatLogGenerator(log_dir)
    
    print(f" Log directory: {log_dir}")
    print("\nSelect an option:")
    print("1. Generate 100 sample logs")
    print("2. Generate 50 archive logs")
    print("3. Mixed scenario (realistic usage)")
    print("4. Real-time generation (5 minutes)")
    print("5. Continuous generation (Ctrl+C to stop)")
    print("6. Show statistics")
    print("7. Custom batch")
    
    choice = input("\nEnter your choice (1-7): ").strip()
    
    if choice == "1":
        generator.generate_batch_logs(100)
    elif choice == "2":
        generator.generate_batch_logs(50, archive=True)
    elif choice == "3":
        generator.generate_mixed_scenario()
    elif choice == "4":
        generator.generate_realtime_logs(interval=2.0, duration=300)
    elif choice == "5":
        print("Starting continuous generation. Press Ctrl+C to stop...")
        try:
            while True:
                generator.generate_realtime_logs(interval=1.0, duration=60)
                time.sleep(5)
        except KeyboardInterrupt:
            print("\nStopping continuous generation...")
    elif choice == "6":
        generator.display_stats()
    elif choice == "7":
        try:
            count = int(input("Enter number of logs to generate: "))
            archive = input("Generate in archive file? (y/n): ").lower() == 'y'
            generator.generate_batch_logs(count, archive)
        except ValueError:
            print("Invalid input. Please enter a valid number.")
    else:
        print("Invalid choice. Please run the script again.")
    
    print("\n" + "="*50)
    generator.display_stats()

if __name__ == "__main__":
    main()
EOF

chmod +x run_chat_logs.py

echo "✓ Created run_chat_logs.py"

# Create systemd service file for continuous logging
cat > chat-log-generator.service << 'EOF'
[Unit]
Description=ft-transcendence Chat Log Generator
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=/opt/ft-transcendence-logs
ExecStart=/usr/bin/python3 /opt/ft-transcendence-logs/chat_log_generator.py continuous
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Created systemd service file"

# Create log rotation configuration
cat > chat-logs-logrotate << 'EOF'
/var/log/ft-transcendence/chat-messages/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        # Signal the log generator to reopen files if running
        pkill -HUP -f "chat_log_generator.py" || true
    endscript
}
EOF

echo "✓ Created logrotate configuration"

# Create example cron job
cat > chat-logs-cron << 'EOF'
# Add to crontab with: crontab -e
# Generate logs every 5 minutes during business hours
*/5 9-17 * * 1-5 /usr/bin/python3 /opt/ft-transcendence-logs/chat_log_generator.py batch 10

# Generate burst of logs every hour (simulating peak activity)
0 * * * * /usr/bin/python3 /opt/ft-transcendence-logs/chat_log_generator.py batch 25

# Generate archive logs daily at midnight
0 0 * * * /usr/bin/python3 /opt/ft-transcendence-logs/chat_log_generator.py batch 50 archive
EOF

echo "✓ Created cron job examples"

echo ""
echo " Setup Complete!"
echo "=================="
echo ""
echo "What was created:"
echo "  • Log directories: $LOG_DIR and $LOCAL_LOG_DIR"
echo "  • Main generator: chat_log_generator.py"
echo "  • Sample runner: run_chat_logs.py"
echo "  • Service file: chat-log-generator.service"
echo "  • Logrotate config: chat-logs-logrotate"
echo "  • Cron examples: chat-logs-cron"
echo ""
echo " Quick Start:"
echo "  1. Test locally: python3 run_chat_logs.py"
echo "  2. Generate batch: python3 chat_log_generator.py batch 100"
echo "  3. Real-time: python3 chat_log_generator.py realtime 2 300"
echo "  4. Mixed scenario: python3 chat_log_generator.py mixed"
echo ""
echo " Monitor logs:"
echo "  • tail -f $LOCAL_LOG_DIR/chat-messages.log"
echo "  • tail -f $LOG_DIR/chat-messages.log"
echo ""
echo " Production setup:"
echo "  • Copy files to /opt/ft-transcendence-logs/"
echo "  • Install service: sudo systemctl enable chat-log-generator.service"
echo "  • Setup logrotate: sudo cp chat-logs-logrotate /etc/logrotate.d/"
echo ""
echo "Ready to generate chat logs! "
