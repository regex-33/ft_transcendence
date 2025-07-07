const fastify = require("fastify")();
const db = require("./models");
fastify.addHook("onRequest", async (request, reply) => {
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
});

db.sequelize
  .sync()
  .then(() => {
    console.log("Database connected successfully");
    fastify.listen({ port: 3000 }, () =>
      console.log(`Server is running on port 3000`)
    );
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  });

const UserRoutes = require("./Router");

fastify.register(UserRoutes, { prefix: "/api" });
