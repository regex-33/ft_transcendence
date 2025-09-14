#!/bin/bash
# notification-log-runner.sh
# Setup and run the notification service log generator

set -e

# Configuration
LOG_DIR="${LOG_DIR:-/var/log/ft-transcendence/notification-service}"
PYTHON_SCRIPT="notification_log_generator.py"
PID_FILE="/tmp/notification-log-generator.pid"
LOG_FILE="/tmp/notification-log-generator.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
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

check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check if Python 3 is available
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    
    # Check Python version
    PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    print_status "Python version: $PYTHON_VERSION"
    
    if [[ $(echo "$PYTHON_VERSION < 3.6" | bc -l) -eq 1 ]]; then
        print_error "Python 3.6+ is required"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

create_directories() {
    print_status "Creating log directories..."
    
    # Create main log directory
    if [ ! -d "$LOG_DIR" ]; then
        sudo mkdir -p "$LOG_DIR"
        print_success "Created directory: $LOG_DIR"
    else
        print_status "Directory already exists: $LOG_DIR"
    fi
    
    # Set proper permissions
    sudo chown -R $USER:$USER "$LOG_DIR" 2>/dev/null || true
    sudo chmod -R 755 "$LOG_DIR" 2>/dev/null || true
    
    print_success "Directory setup completed"
}

create_log_files() {
    print_status "Creating log files..."
    
    # Create log files if they don't exist
    touch "$LOG_DIR/notification.log"
    touch "$LOG_DIR/notification-error.log"
    
    print_success "Log files created"
}

start_generator() {
    print_status "Starting notification log generator..."
    
    # Check if already running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            print_warning "Log generator is already running (PID: $PID)"
            return 0
        else
            print_status "Removing stale PID file"
            rm -f "$PID_FILE"
        fi
    fi
    
    # Start the generator in background
    nohup python3 "$PYTHON_SCRIPT" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    sleep 2
    
    # Check if process is still running
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        print_success "Log generator started successfully (PID: $PID)"
        print_status "Log output: $LOG_FILE"
        print_status "Generated logs will be written to: $LOG_DIR"
    else
        print_error "Failed to start log generator"
        cat "$LOG_FILE"
        exit 1
    fi
}

stop_generator() {
    print_status "Stopping notification log generator..."
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            kill "$PID"
            sleep 2
            
            # Force kill if still running
            if ps -p "$PID" > /dev/null 2>&1; then
                kill -9 "$PID"
            fi
            
            rm -f "$PID_FILE"
            print_success "Log generator stopped"
        else
            print_warning "Log generator was not running"
            rm -f "$PID_FILE"
        fi
    else
        print_warning "PID file not found. Log generator may not be running"
    fi
}

status_generator() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            print_success "Log generator is running (PID: $PID)"
            
            # Show some stats
            print_status "Log files:"
            if [ -f "$LOG_DIR/notification.log" ]; then
                NORMAL_COUNT=$(wc -l < "$LOG_DIR/notification.log")
                print_status "  notification.log: $NORMAL_COUNT lines"
            fi
            
            if [ -f "$LOG_DIR/notification-error.log" ]; then
                ERROR_COUNT=$(wc -l < "$LOG_DIR/notification-error.log")
                print_status "  notification-error.log: $ERROR_COUNT lines"
            fi
            
            return 0
        else
            print_error "Log generator is not running (stale PID file)"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        print_error "Log generator is not running"
        return 1
    fi
}

tail_logs() {
    print_status "Tailing notification logs (Ctrl+C to stop)..."
    
    if [ -f "$LOG_DIR/notification.log" ]; then
        tail -f "$LOG_DIR/notification.log" "$LOG_DIR/notification-error.log" 2>/dev/null
    else
        print_error "Log files not found. Make sure the generator is running."
        exit 1
    fi
}

show_sample_logs() {
    print_status "Showing sample logs..."
    
    if [ -f "$LOG_DIR/notification.log" ]; then
        print_status "Last 5 normal logs:"
        tail -n 5 "$LOG_DIR/notification.log" | jq '.' 2>/dev/null || tail -n 5 "$LOG_DIR/notification.log"
    fi
    
    if [ -f "$LOG_DIR/notification-error.log" ]; then
        print_status "Last 5 error logs:"
        tail -n 5 "$LOG_DIR/notification-error.log" | jq '.' 2>/dev/null || tail -n 5 "$LOG_DIR/notification-error.log"
    fi
}

cleanup_logs() {
    print_status "Cleaning up old logs..."
    
    if [ -f "$LOG_DIR/notification.log" ]; then
        > "$LOG_DIR/notification.log"
        print_success "Cleared notification.log"
    fi
    
    if [ -f "$LOG_DIR/notification-error.log" ]; then
        > "$LOG_DIR/notification-error.log"
        print_success "Cleared notification-error.log"
    fi
}

show_help() {
    cat << EOF
Notification Service Log Generator

Usage: $0 [COMMAND]

Commands:
    start       Start the log generator
    stop        Stop the log generator
    restart     Restart the log generator
    status      Show generator status
    tail        Tail the log files
    sample      Show sample logs
    clean       Clean up old logs
    setup       Setup directories and files
    help        Show this help message

Environment Variables:
    LOG_DIR     Directory for log files (default: /var/log/ft-transcendence/notification-service)

Examples:
    $0 start
    $0 status
    $0 tail
    LOG_DIR=/tmp/logs $0 start
EOF
}

# Main script logic
case "${1:-help}" in
    "start")
        check_dependencies
        create_directories
        create_log_files
        start_generator
        ;;
    "stop")
        stop_generator
        ;;
    "restart")
        stop_generator
        sleep 1
        check_dependencies
        create_directories
        create_log_files
        start_generator
        ;;
    "status")
        status_generator
        ;;
    "tail")
        tail_logs
        ;;
    "sample")
        show_sample_logs
        ;;
    "clean")
        cleanup_logs
        ;;
    "setup")
        check_dependencies
        create_directories
        create_log_files
        print_success "Setup completed"
        ;;
    "help"|*)
        show_help
        ;;
esac
