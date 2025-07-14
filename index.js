const fastify = require("fastify")();
const db = require("./models");
const banner = require("./middleware/banner");
const path = require("path");
const fastifyStatic = require("@fastify/static");
const { UserRoutes, FriendRoutes, OauthRoutes,  checkCodeRoutes , _2faRoutes} = require("./Router");
const logger = require("./middleware/logger");

fastify.addHook("onResponse", logger);
fastify.addHook("onRequest", banner);


fastify.register(require("@fastify/multipart"));
fastify.register(UserRoutes, { prefix: "/api/users" });
fastify.register(FriendRoutes, { prefix: "/api/friends" });
fastify.register(OauthRoutes, { prefix: "/api/auth" });
fastify.register(checkCodeRoutes, { prefix: "/api" });
fastify.register(_2faRoutes, { prefix: "/api/2fa" });
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "uploads"),
  prefix: "/uploads/",
});

fastify.get("/", (req, reply) => {
  reply.type("text/html").sendFile("oauth.html");
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
