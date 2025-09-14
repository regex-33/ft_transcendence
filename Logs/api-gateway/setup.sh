#!/bin/bash
# setup-api-gateway-logs.sh
# Setup script for API Gateway log generation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="/var/log/ft-transcendence/api-gateway"
PYTHON_SCRIPT="api_gateway_log_generator.py"

echo -e "${GREEN} Setting up API Gateway Log Generation${NC}"
echo "============================================="

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        echo -e "${YELLOW}  Running as root${NC}"
        return 0
    else
        echo -e "${YELLOW}  Not running as root - will use sudo for directory creation${NC}"
        return 1
    fi
}

# Function to create directory structure
create_directories() {
    echo -e "${GREEN} Creating directory structure...${NC}"
    
    if check_root; then
        mkdir -p "$LOG_DIR"
        chmod 755 "$LOG_DIR"
        echo -e "${GREEN}✓ Created: $LOG_DIR${NC}"
    else
        sudo mkdir -p "$LOG_DIR"
        sudo chmod 755 "$LOG_DIR"
        echo -e "${GREEN}✓ Created: $LOG_DIR${NC}"
    fi
}

# Function to create log files
create_log_files() {
    echo -e "${GREEN}📄 Creating log files...${NC}"
    
    local files=("access.log" "error.log" "gateway.log")
    
    for file in "${files[@]}"; do
        local filepath="$LOG_DIR/$file"
        if check_root; then
            touch "$filepath"
            chmod 644 "$filepath"
        else
            sudo touch "$filepath"
            sudo chmod 644 "$filepath"
        fi
        echo -e "${GREEN}✓ Created: $filepath${NC}"
    done
}

# Function to set permissions
set_permissions() {
    echo -e "${GREEN} Setting permissions...${NC}"
    
    if check_root; then
        chown -R root:root "$LOG_DIR"
        chmod -R 755 "$LOG_DIR"
        chmod -R 644 "$LOG_DIR"/*.log
    else
        sudo chown -R root:root "$LOG_DIR"
        sudo chmod -R 755 "$LOG_DIR"
        sudo chmod -R 644 "$LOG_DIR"/*.log
    fi
    
    echo -e "${GREEN}✓ Permissions set${NC}"
}

# Function to check Python requirements
check_python() {
    echo -e "${GREEN}🐍 Checking Python requirements...${NC}"
    
    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}✓ Python3 found: $(python3 --version)${NC}"
    else
        echo -e "${RED}✗ Python3 not found. Please install Python3.${NC}"
        exit 1
    fi
}

# Function to create systemd service (optional)
create_systemd_service() {
    echo -e "${GREEN} Creating systemd service...${NC}"
    
    local service_content="[Unit]
Description=API Gateway Log Generator for ft-transcendence
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$(pwd)
ExecStart=$(which python3) $(pwd)/$PYTHON_SCRIPT --log-dir $LOG_DIR
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"

    if check_root; then
        echo "$service_content" > /etc/systemd/system/ft-transcendence-api-gateway-logs.service
        systemctl daemon-reload
        echo -e "${GREEN}✓ Systemd service created: ft-transcendence-api-gateway-logs.service${NC}"
        echo -e "${YELLOW} To start the service: systemctl start ft-transcendence-api-gateway-logs${NC}"
        echo -e "${YELLOW} To enable on boot: systemctl enable ft-transcendence-api-gateway-logs${NC}"
    else
        local temp_file=$(mktemp)
        echo "$service_content" > "$temp_file"
        sudo mv "$temp_file" /etc/systemd/system/ft-transcendence-api-gateway-logs.service
        sudo systemctl daemon-reload
        echo -e "${GREEN}✓ Systemd service created: ft-transcendence-api-gateway-logs.service${NC}"
        echo -e "${YELLOW} To start the service: sudo systemctl start ft-transcendence-api-gateway-logs${NC}"
        echo -e "${YELLOW} To enable on boot: sudo systemctl enable ft-transcendence-api-gateway-logs${NC}"
    fi
}

# Function to display usage instructions
show_usage() {
    echo -e "${GREEN}Usage Instructions${NC}"
    echo "===================="
    echo ""
    echo -e "${YELLOW}Manual execution:${NC}"
    echo "  python3 $PYTHON_SCRIPT"
    echo ""
    echo -e "${YELLOW}With custom directory:${NC}"
    echo "  python3 $PYTHON_SCRIPT --log-dir /custom/path"
    echo ""
    echo -e "${YELLOW}Run for specific duration:${NC}"
    echo "  python3 $PYTHON_SCRIPT --duration 300  # 5 minutes"
    echo ""
    echo -e "${YELLOW}Using systemd service:${NC}"
    echo "  sudo systemctl start ft-transcendence-api-gateway-logs"
    echo "  sudo systemctl stop ft-transcendence-api-gateway-logs"
    echo "  sudo systemctl status ft-transcendence-api-gateway-logs"
    echo ""
    echo -e "${YELLOW}Monitor logs:${NC}"
    echo "  tail -f $LOG_DIR/access.log"
    echo "  tail -f $LOG_DIR/gateway.log"
    echo "  tail -f $LOG_DIR/error.log"
    echo ""
    echo -e "${YELLOW}View log structure:${NC}"
    echo "  tree $LOG_DIR/"
    echo "  ls -la $LOG_DIR/"
}

# Function to verify setup
verify_setup() {
    echo -e "${GREEN} Verifying setup...${NC}"
    
    # Check if directory exists
    if [ -d "$LOG_DIR" ]; then
        echo -e "${GREEN}✓ Directory exists: $LOG_DIR${NC}"
    else
        echo -e "${RED}✗ Directory missing: $LOG_DIR${NC}"
        return 1
    fi
    
    # Check if log files exist
    local files=("access.log" "error.log" "gateway.log")
    for file in "${files[@]}"; do
        if [ -f "$LOG_DIR/$file" ]; then
            echo -e "${GREEN}✓ File exists: $LOG_DIR/$file${NC}"
        else
            echo -e "${RED}✗ File missing: $LOG_DIR/$file${NC}"
            return 1
        fi
    done
    
    # Check if Python script exists
    if [ -f "$PYTHON_SCRIPT" ]; then
        echo -e "${GREEN}✓ Python script exists: $PYTHON_SCRIPT${NC}"
    else
        echo -e "${RED}✗ Python script missing: $PYTHON_SCRIPT${NC}"
        return 1
    fi
    
    return 0
}

# Main execution
main() {
    echo -e "${GREEN}Starting setup...${NC}"
    echo ""
    
    # Check Python availability
    check_python
    
    # Create directories
    create_directories
    
    # Create log files
    create_log_files
    
    # Set permissions
    set_permissions
    
    # Verify setup
    if verify_setup; then
        echo -e "${GREEN}✓ Setup completed successfully!${NC}"
        echo ""
        
        # Ask about systemd service
        read -p "Do you want to create a systemd service? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_systemd_service
        fi
        
        echo ""
        show_usage
    else
        echo -e "${RED}✗ Setup failed. Please check the errors above.${NC}"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        show_usage
        exit 0
        ;;
    --verify)
        verify_setup
        exit $?
        ;;
    *)
        main
        ;;
esac
