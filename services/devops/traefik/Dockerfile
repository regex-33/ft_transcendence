FROM traefik:v2.0


# Copy custom static configuration
COPY config/traefik.yml /etc/traefik/traefik.yml

# Copy dynamic configuration files
COPY dynamic/routes.yml /etc/traefik/dynamic/
COPY dynamic/middleware.yml /etc/traefik/dynamic/
COPY dynamic/tls.yml /etc/traefik/dynamic/

# Copy SSL certificates
COPY certs/ /etc/ssl/certs/
COPY scripts/wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Set proper permissions
RUN chmod 644 /etc/ssl/certs/*.crt && \
    chmod 600 /etc/ssl/certs/*.key && \
    chmod 644 /etc/traefik/traefik.yml && \
    chmod -R 644 /etc/traefik/dynamic/

# Create traefik user and set ownership
RUN addgroup -g 1000 traefik && \
    adduser -D -s /bin/sh -u 1000 -G traefik traefik && \
    chown -R traefik:traefik /etc/traefik/

# Expose ports
EXPOSE 80 443 8080

# Use the default traefik entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["traefik", "--configfile=/etc/traefik/traefik.yml"]
