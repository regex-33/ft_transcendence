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

// const arrayofClients = new Map();
// const arrayofBannedClients = new Array();
// const timeNow = Date.now();

// fastify.addHook("onRequest", (request, reply) => {
//   if (arrayofBannedClients.includes(request.ip)) {
//     return reply.status(403).send({ error: "You are banned" });
//   }
//   if (timeNow - Date.now() > 5 * 60 * 1000) {
//     arrayofClients.clear();
//   }
//   const clientIp = request.ip;
//   if (arrayofClients.has(clientIp)) {
//     if (arrayofClients.get(clientIp).time - Date.now() < process.env.TIME_BTWN_REQUESTS) 
//     {
//       arrayofClients.get(clientIp).count++;
//     }
//     else {
//       arrayofClients.set(clientIp, {
//         time: Date.now(),
//         count: 1,
//       });
//     }
//     if (arrayofClients.get(clientIp).count > process.env.NUMBER_OF_REQUESTS_TO_BAN) {
//       return reply.status(429).send({ error: "Too many requests" });
//     }
//   } else {
//     arrayofClients.set(clientIp, {
//       time: Date.now(),
//       count: 1,
//     });
//   }
// });

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
