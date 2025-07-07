FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/
COPY sites-available/ /etc/nginx/sites-available/

# Create sites-enabled directory and link default site
RUN mkdir -p /etc/nginx/sites-enabled
RUN ln -s /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/

# Copy SSL certificates (if any)
COPY ssl/ /etc/nginx/ssl/

# Copy Lua scripts (if using OpenResty)
COPY lua/ /etc/nginx/lua/

# Create log directories
RUN mkdir -p /var/log/nginx

# Set permissions
RUN chown -R nginx:nginx /var/log/nginx

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]