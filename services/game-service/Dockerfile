FROM node:lts-slim

WORKDIR /game-service
COPY . .
COPY .env ./.env

RUN npm install
RUN npx prisma migrate dev

EXPOSE 3000
CMD ["npm", "run", "dev"]
