const fastify = require("fastify")();
const db = require("./models");
const path = require("path");
const fastifyStatic = require("@fastify/static");
const {UserRoutes,FriendRoutes} = require("./Router");

fastify.addHook("onRequest", async (request, reply) => {
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url} ,content-Type: ${request.headers['content-type']} - Body:`, request.body);
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "uploads"),
  prefix: "/uploads/",
});

fastify.register(require("@fastify/multipart"));

fastify.register(UserRoutes, { prefix: "/api" });
fastify.register(FriendRoutes, { prefix: "/api" });

db.sequelize
  .sync()
  .then(() => {
    console.log("Database connected successfully");
    return fastify.listen({ port: 3000, host: '0.0.0.0' });
  })
  .then(() => {
    console.log(`Server is running on port 3000`);
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  });
