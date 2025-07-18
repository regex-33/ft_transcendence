const fastify = require("fastify")();
const db = require("./models");
const banner = require("./util/banner");
const path = require("path");
const fastifyStatic = require("@fastify/static");
const { UserRoutes, FriendRoutes, OauthRoutes, checkCodeRoutes, _2faRoutes } = require("./Router");
const logger = require("./util/logger_request");

fastify.addHook("onResponse", logger);
fastify.addHook("onRequest", banner);
const fastifyCookie = require('@fastify/cookie');

fastify.register(fastifyCookie);

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

const PORT = process.env.PORT || 8001;
const HOST = process.env.HOST || "0.0.0.0";

function connect() {
  db.sequelize
    .sync()
    .then(() => {
      console.log("Database connected successfully");
      return fastify.listen({ port: PORT, host: HOST });
    })
    .then(() => {
      console.log(`Server is running on port ${PORT}`);
    })
    .catch((err) => {
      console.error("Unable to connect to the database:", err);
      setTimeout(() => {
        connect();
      }, 1000);
    });
}
connect();