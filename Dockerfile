FROM node:18-slim

# Install PostgreSQL client tools
RUN apt-get update && \
    apt-get install -y postgresql postgresql-contrib && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .
RUN npm install --production

RUN chmod +x enterpoint.sh

EXPOSE 3000

ENTRYPOINT ["sh", "./enterpoint.sh"]