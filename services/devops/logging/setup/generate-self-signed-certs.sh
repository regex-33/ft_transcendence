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
ST=BenGuerir
L=BenGuerir
O=Regex33
CN=ft-transcendence.com

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = ft-transcendence.com
DNS.2 = *.ft-transcendence.com
DNS.3 = traefik.ft-transcendence.com
DNS.4 = logging.ft-transcendence.com
DNS.5 = monitoring.ft-transcendence.com
DNS.6 = prometheus.ft-transcendence.com
DNS.7 = localhost
IP.1 = 127.0.0.1
EOF

# Generate private key
openssl genrsa -out ./services/devops/traefik/certs/ft-transcendence.key 2048

# Generate certificate signing request
openssl req -new -key ./services/devops/traefik/certs/ft-transcendence.key -out ./services/devops/traefik/certs/ft-transcendence.csr -config ./services/devops/traefik/certs/ssl.conf

# Generate self-signed certificate
openssl x509 -req -in ./services/devops/traefik/certs/ft-transcendence.csr -signkey ./services/devops/traefik/certs/ft-transcendence.key -out ./services/devops/traefik/certs/ft-transcendence.crt -days 365 -extensions v3_req -extfile ./services/devops/traefik/certs/ssl.conf

# Create Traefik certificate configuration
cat > ./services/devops/traefik/certs/tls.yml <<EOF
tls:
  certificates:
    - certFile: /etc/ssl/certs/ft-transcendence.crt
      keyFile: /etc/ssl/certs/ft-transcendence.key
      stores:
        - default
  stores:
    default:
      defaultCertificate:
        certFile: /etc/ssl/certs/ft-transcendence.crt
        keyFile: /etc/ssl/certs/ft-transcendence.key
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
echo "   - ft-transcendence.com"
echo "   - *.ft-transcendence.com"
echo "   - traefik.ft-transcendence.com"
echo "   - logging.ft-transcendence.com"
echo "   - monitoring.ft-transcendence.com"
echo ""
echo "  Don't forget to add these to your /etc/hosts file:"
echo "   ${MANAGER_IP:-10.13.250.29} ft-transcendence.com"
echo "   ${WORKER1_IP:-10.13.249.247} logging.ft-transcendence.com"
echo "   ${WORKER2_IP:-10.13.249.246} monitoring.ft-transcendence.com"
echo "   ${MANAGER_IP:-10.13.250.29} traefik.ft-transcendence.com"

# Set proper permissions
chmod 644 ./services/devops/traefik/certs/ft-transcendence.crt
chmod 600 ./services/devops/traefik/certs/ft-transcendence.key