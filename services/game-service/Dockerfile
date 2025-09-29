FROM node:lts-slim

WORKDIR /game-service
COPY . .


ARG DATABASE_URL
# ENV DATABASE_URL=${DATABASE_URL}
ENV DATABASE_URL=${DATABASE_URL}

# RUN echo "DATABASE_URL is: $DATABASE_URL"
RUN env


RUN apt-get update -y && apt-get install -y openssl
RUN npm install
RUN npx prisma migrate dev --name dev
RUN npx prisma generate


EXPOSE 3000
CMD ["npm", "run", "dev"]
