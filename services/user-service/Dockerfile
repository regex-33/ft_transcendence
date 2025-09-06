FROM node:18-alpine

WORKDIR /app

COPY package*.json ./


COPY . .

RUN npm i nodemon -g 
RUN npm i @fastify/websocket

RUN npm install

EXPOSE 8001
CMD ["npm", "run" ,"dev"]
