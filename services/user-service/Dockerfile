FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache make g++ python3 bash
COPY . .

RUN npm i nodemon -g

RUN npm install

EXPOSE 8001
CMD ["npm", "run" ,"dev"]