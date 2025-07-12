const fastify = require("fastify")();
const db = require("./models");
const { request } = require("undici");

const path = require("path");
const fastifyStatic = require("@fastify/static");
const { UserRoutes, FriendRoutes, OauthRoutes,  checkCodeRoutes} = require("./Router");
const { Console } = require("console");

fastify.addHook("onResponse", async (request, reply) => {
  console.log(
    `[${new Date().toISOString()}] ${request.method} ${request.url}  - ${
      reply.statusCode
    }`
  );
});

const arrayOfClients = new Map();
const arrayOfBannedClients = new Set();
const CLEANUP_INTERVAL = Number(process.env.CLEANUP_INTERVAL) || 300000; 
let lastCleanup = Date.now();

fastify.addHook("onRequest", (request, reply, done) => {
  const now = Date.now();
  const clientIp = request.ip;

  if (arrayOfBannedClients.has(clientIp)) {
    return reply.status(403).send({ error: "You are banned" });
  }

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    arrayOfClients.clear();
    lastCleanup = now;
  }

  const TIME_BTWN_REQUESTS = Number(process.env.TIME_BTWN_REQUESTS) || 3000;
  const MAX_REQUESTS = Number(process.env.NUMBER_OF_REQUESTS_TO_BAN) || 10;

  const client = arrayOfClients.get(clientIp);
  if (client) {
    if (now - client.time < TIME_BTWN_REQUESTS) {
      client.count++;
    } else {
      client.count = 1;
      client.time = now;
    }

    if (client.count >= MAX_REQUESTS) {
      arrayOfBannedClients.add(clientIp);
      return reply.status(429).send({ error: "Too many requests - Banned" });
    }

    arrayOfClients.set(clientIp, client);
  } else {
    arrayOfClients.set(clientIp, {
      time: now,
      count: 1,
    });
  }

  done(); 
});


fastify.get("/", (req, reply) => {
  reply.send({ message: "Welcome to the Transcendence API" });
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "uploads"),
  prefix: "/uploads/",
});

fastify.register(require("@fastify/multipart"));

fastify.register(UserRoutes, { prefix: "/api" });
fastify.register(FriendRoutes, { prefix: "/api" });
fastify.register(OauthRoutes, { prefix: "/api" });
fastify.register(checkCodeRoutes, { prefix: "/api" });

db.sequelize
  .sync()
  .then(() => {
    console.log("Database connected successfully");
    return fastify.listen({ port: 3000, host: "0.0.0.0" });
  })
  .then(() => {
    console.log(`Server is running on port 3000`);
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  });
