FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Install PM2 for process management
RUN npm install -g pm2

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Change ownership
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

CMD ["pm2-runtime", "start", "ecosystem.config.js"]