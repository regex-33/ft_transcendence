#!/bin/bash
# Trust self-signed certificate system-wide
# File: scripts/trust-certificate.sh

set -e

CERT_FILE="./certs/ft-transcendence.crt"

if [ ! -f "$CERT_FILE" ]; then
    echo "Certificate file not found: $CERT_FILE"
    echo "Please generate certificates first: make generate-certs"
    exit 1
fi

echo "Trusting self-signed certificate system-wide..."

# Detect OS and trust certificate accordingly
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Ubuntu/Debian
    if command -v update-ca-certificates &> /dev/null; then
        echo "Installing certificate on Ubuntu/Debian..."
        sudo cp "$CERT_FILE" /usr/local/share/ca-certificates/ft-transcendence.crt
        sudo update-ca-certificates
        echo "Certificate trusted on Ubuntu/Debian"
    # RHEL/CentOS
    elif command -v update-ca-trust &> /dev/null; then
        echo "Installing certificate on RHEL/CentOS..."
        sudo cp "$CERT_FILE" /etc/pki/ca-trust/source/anchors/ft-transcendence.crt
        sudo update-ca-trust
        echo "Certificate trusted on RHEL/CentOS"
    else
        echo "Unsupported Linux distribution"
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Installing certificate on macOS..."
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CERT_FILE"
    echo "Certificate trusted on macOS"
else
    echo "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Test the certificate
echo "Testing certificate trust..."
if curl -s https://ft-transcendence.com > /dev/null; then
    echo "✓ Certificate is trusted - HTTPS connections should work"
    echo "✓ WebSocket WSS connections should now work"
else
    echo "✗ Certificate trust verification failed"
    echo "You may need to restart your browser or terminal"
fi

echo ""
echo "Note: You may need to:"
echo "1. Restart your browser"
echo "2. Restart your terminal"
echo "3. Set NODE_TLS_REJECT_UNAUTHORIZED=0 for Node.js applications (development only)"
