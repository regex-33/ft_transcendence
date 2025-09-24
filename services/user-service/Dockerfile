FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
ENV PROJECT_PATH=/app

RUN apk add --no-cache make g++ python3 bash
COPY . .

RUN mkdir -p /var/log/user-service /var/log/file-service
RUN touch /var/log/user-service/user-service.log /var/log/file-service/file-service.log
RUN npm i nodemon -g

RUN npm install

EXPOSE 8001
CMD ["npm", "run" ,"dev"]