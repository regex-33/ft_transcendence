#!/bin/bash

# Chat Service Log Generator Runner Script
# This script helps you easily generate chat service logs

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

LOG_DIR="/var/log/ft-transcendence/chat-service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script needs to be run as root to write to /var/log/"
        print_info "Please run: sudo $0 $@"
        exit 1
    fi
}

# Function to create log directory structure
create_log_structure() {
    print_info "Creating log directory structure..."
    
    # Create main directory
    mkdir -p "$LOG_DIR"
    mkdir -p "$LOG_DIR/messages"
    
    # Create log files
    touch "$LOG_DIR/chat.log"
    touch "$LOG_DIR/chat-error.log"
    touch "$LOG_DIR/messages/messages.log"
    touch "$LOG_DIR/messages/messages-archive.log"
    
    # Set permissions
    chmod 755 "$LOG_DIR"
    chmod 755 "$LOG_DIR/messages"
    chmod 644 "$LOG_DIR"/*.log
    chmod 644 "$LOG_DIR/messages"/*.log
    
    print_success "Log directory structure created at $LOG_DIR"
}

# Function to show current log status
show_log_status() {
    print_info "Current log status:"
    echo "Log directory: $LOG_DIR"
    echo
    
    if [[ -d "$LOG_DIR" ]]; then
        echo "Directory structure:"
        tree "$LOG_DIR" 2>/dev/null || ls -la "$LOG_DIR"
        echo
        
        echo "Log file sizes:"
        for log_file in "$LOG_DIR/chat.log" "$LOG_DIR/chat-error.log" "$LOG_DIR/messages/messages.log" "$LOG_DIR/messages/messages-archive.log"; do
            if [[ -f "$log_file" ]]; then
                size=$(stat -c%s "$log_file" 2>/dev/null || stat -f%z "$log_file" 2>/dev/null || echo "0")
                lines=$(wc -l < "$log_file" 2>/dev/null || echo "0")
                echo "  $(basename "$log_file"): $size bytes, $lines lines"
            fi
        done
    else
        print_warning "Log directory does not exist. Run 'setup' first."
    fi
}

# Function to generate sample logs
generate_sample_logs() {
    local count=${1:-100}
    
    print_info "Generating $count sample log entries..."
    
    python3 - <<EOF
import sys
import os
sys.path.insert(0, '$SCRIPT_DIR')

# Import the generator (assuming the main script is in the same directory)
exec(open('$SCRIPT_DIR/chat_log_generator.py').read())

generator = ChatLogGenerator('$LOG_DIR')
generator.generate_batch($count)
EOF
    
    print_success "Sample logs generated!"
}

# Function to start continuous log generation
start_continuous_generation() {
    local workers=${1:-2}
    
    print_info "Starting continuous log generation with $workers workers..."
    print_info "Press Ctrl+C to stop"
    
    python3 - <<EOF
import sys
import os
sys.path.insert(0, '$SCRIPT_DIR')

# Import the generator
exec(open('$SCRIPT_DIR/chat_log_generator.py').read())

generator = ChatLogGenerator('$LOG_DIR')
generator.start($workers)
EOF
}

# Function to tail logs
tail_logs() {
    local log_type=${1:-"all"}
    
    case $log_type in
        "chat")
            print_info "Tailing chat.log..."
            tail -f "$LOG_DIR/chat.log"
            ;;
        "error")
            print_info "Tailing chat-error.log..."
            tail -f "$LOG_DIR/chat-error.log"
            ;;
        "messages")
            print_info "Tailing messages.log..."
            tail -f "$LOG_DIR/messages/messages.log"
            ;;
        "archive")
            print_info "Tailing messages-archive.log..."
            tail -f "$LOG_DIR/messages/messages-archive.log"
            ;;
        "all")
            print_info "Tailing all logs..."
            tail -f "$LOG_DIR/chat.log" "$LOG_DIR/chat-error.log" "$LOG_DIR/messages/messages.log" "$LOG_DIR/messages/messages-archive.log"
            ;;
        *)
            print_error "Unknown log type: $log_type"
            print_info "Available types: chat, error, messages, archive, all"
            exit 1
            ;;
    esac
}

# Function to clean logs
clean_logs() {
    print_warning "This will delete all existing logs. Are you sure? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_info "Cleaning all logs..."
        
        # Truncate log files
        > "$LOG_DIR/chat.log"
        > "$LOG_DIR/chat-error.log"
        > "$LOG_DIR/messages/messages.log"
        > "$LOG_DIR/messages/messages-archive.log"
        
        print_success "All logs cleaned!"
    else
        print_info "Operation cancelled."
    fi
}

# Function to show help
show_help() {
    echo "Chat Service Log Generator"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  setup              Create log directory structure"
    echo "  status             Show current log status"
    echo "  generate [COUNT]   Generate sample logs (default: 100)"
    echo "  start [WORKERS]    Start continuous log generation (default: 2 workers)"
    echo "  tail [TYPE]        Tail logs (types: chat, error, messages, archive, all)"
    echo "  clean              Clean all log files"
    echo "  help               Show this help message"
    echo
    echo "Examples:"
    echo "  $0 setup                    # Create log structure"
    echo "  $0 generate 500             # Generate 500 sample logs"
    echo "  $0 start 3                  # Start with 3 worker threads"
    echo "  $0 tail chat                # Tail chat.log"
    echo "  $0 tail all                 # Tail all logs"
    echo
    echo "Log directory: $LOG_DIR"
}

# Main script logic
case "${1:-help}" in
    "setup")
        check_root
        create_log_structure
        ;;
    "status")
        show_log_status
        ;;
    "generate")
        check_root
        generate_sample_logs "${2:-100}"
        ;;
    "start")
        check_root
        start_continuous_generation "${2:-2}"
        ;;
    "tail")
        tail_logs "${2:-all}"
        ;;
    "clean")
        check_root
        clean_logs
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
