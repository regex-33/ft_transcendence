FROM node:lts-slim

WORKDIR /game-service
COPY . .
COPY .env ./.env

RUN apt-get update -y && apt-get install -y openssl
RUN npm install
RUN npx prisma migrate dev --name dev
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "dev"]
