FROM node:18-slim

# Install PostgreSQL client tools
RUN apt-get update && \
    apt-get install -y postgresql postgresql-contrib && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .
RUN npm install --production

RUN chmod +x database.sh

EXPOSE 3000

ENTRYPOINT ["sh", "./database.sh"]