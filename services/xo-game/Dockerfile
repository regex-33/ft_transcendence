
FROM node:18-alpine

RUN apk add --no-cache bash
WORKDIR /app

COPY package*.json ./
ENV PROJECT_PATH=/app

COPY . .

RUN npm i nodemon -g

RUN npm install

EXPOSE 8083
CMD ["npm", "run" ,"dev"]
