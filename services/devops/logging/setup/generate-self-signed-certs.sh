#!/bin/bash

# Create certificates directory
# mkdir -p certs
mkdir -p ./services/devops/traefik/certs

# Create a configuration file for the certificate
cat > ./services/devops/traefik/certs/ssl.conf <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=MA
ST=Casablanca
L=Casablanca
O=Regex33
CN=regex-33.com

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = regex-33.com
DNS.2 = *.regex-33.com
DNS.3 = traefik.regex-33.com
DNS.4 = logging.regex-33.com
DNS.5 = monitoring.regex-33.com
DNS.6 = prometheus.regex-33.com
DNS.7 = localhost
IP.1 = 127.0.0.1
EOF

# Generate private key
openssl genrsa -out ./services/devops/traefik/certs/regex-33.key 2048

# Generate certificate signing request
openssl req -new -key ./services/devops/traefik/certs/regex-33.key -out ./services/devops/traefik/certs/regex-33.csr -config ./services/devops/traefik/certs/ssl.conf

# Generate self-signed certificate
openssl x509 -req -in ./services/devops/traefik/certs/regex-33.csr -signkey ./services/devops/traefik/certs/regex-33.key -out ./services/devops/traefik/certs/regex-33.crt -days 365 -extensions v3_req -extfile ./services/devops/traefik/certs/ssl.conf

# Create Traefik certificate configuration
cat > ./services/devops/traefik/certs/tls.yml <<EOF
tls:
  certificates:
    - certFile: /etc/ssl/certs/regex-33.crt
      keyFile: /etc/ssl/certs/regex-33.key
      stores:
        - default
  stores:
    default:
      defaultCertificate:
        certFile: /etc/ssl/certs/regex-33.crt
        keyFile: /etc/ssl/certs/regex-33.key
  options:
    default:
      minVersion: "VersionTLS12"
      cipherSuites:
        - "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"
        - "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305"
        - "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"

EOF

echo "✓ Self-signed certificates generated successfully!"
echo " Certificates saved in ./services/devops/traefik/certs/ directory"
echo " Certificate includes domains:"
echo "   - regex-33.com"
echo "   - *.regex-33.com"
echo "   - traefik.regex-33.com"
echo "   - logging.regex-33.com"
echo "   - monitoring.regex-33.com"
echo ""
echo "  Don't forget to add these to your /etc/hosts file:"
echo "   ${MANAGER_IP:-10.13.250.29} regex-33.com"
echo "   ${WORKER1_IP:-10.13.249.247} logging.regex-33.com"
echo "   ${WORKER2_IP:-10.13.249.246} monitoring.regex-33.com"
echo "   ${MANAGER_IP:-10.13.250.29} traefik.regex-33.com"

# Set proper permissions
chmod 644 ./services/devops/traefik/certs/regex-33.crt
chmod 600 ./services/devops/traefik/certs/regex-33.key