FROM hashicorp/vault:1.20.2

# Install required packages including Docker CLI for secrets creation
RUN apk add --no-cache \
    curl \
    jq \
    bash \
    openssl \
    ca-certificates \
    docker-cli

# Create necessary directories
RUN mkdir -p /vault/data \
    /vault/logs \
    /vault/config \
    /vault/policies \
    /vault/scripts \
    /vault/templates \
    /vault/agent/data \
    /vault/secrets

# Copy configuration files
COPY config/vault.hcl /vault/config/
COPY config/agents/ /vault/config/agents/
COPY policies/ /vault/config/policies/
COPY scripts/ /vault/scripts/
COPY templates/ /vault/config/

# Make sure all scripts are executable
RUN chmod +x /vault/scripts/*.sh

# Set permissions
RUN chown -R vault:vault /vault

# Expose ports
EXPOSE 8200 8201

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD vault status || exit 1

# Default command
CMD ["vault", "server", "-config=/vault/config/vault.hcl"]

