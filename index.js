const fastify = require("fastify")();
const db = require("./models");
const banner = require("./middleware/banner");
const path = require("path");
const fastifyStatic = require("@fastify/static");
const { UserRoutes, FriendRoutes, OauthRoutes,  checkCodeRoutes} = require("./Router");
const logger = require("./middleware/logger");

fastify.addHook("onResponse", logger);
fastify.addHook("onRequest", banner);


fastify.register(require("@fastify/multipart"));
fastify.register(UserRoutes, { prefix: "/api" });
fastify.register(FriendRoutes, { prefix: "/api" });
fastify.register(OauthRoutes, { prefix: "/api" });
fastify.register(checkCodeRoutes, { prefix: "/api" });
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "uploads"),
  prefix: "/uploads/",
});

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
