try {


  const fastify = require("fastify")();
  const db = require("./models");
  const { v4: uuidv4 } = require("uuid");
  const path = require("path");
  const fastifyStatic = require("@fastify/static");
  const { UserRoutes, FriendRoutes, OauthRoutes, checkCodeRoutes, _2faRoutes, checksRoutes, NotificationRoutes, AuthRoutes } = require("./Router");
  const logger = require("./util/logger_request");
  const websocket = require('@fastify/websocket')

  fastify.addHook("onResponse", (req, res, done) => {
    req = logger(req, res);
    done();
  });
  fastify.addHook("onRequest", (req, res, done) => {
    req.object = {
      startTime: Date.now(),
      username: null,
      type: null,
      action: null,
      success: false,
      error: null,
      token: null,
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        user_agent: req.headers["user-agent"]
      }
    }
    done();
  });
  const fastifyCookie = require('@fastify/cookie');




  fastify.register(fastifyCookie);
  fastify.register(require("@fastify/multipart"), {
    limits: {
      fileSize: Number(process.env.FILESIZELIMIT || 100_000_000), // 100MB
    }
  });
  fastify.register(websocket).then(() => {
    fastify.register(UserRoutes, { prefix: "/api/users" });
  })
  fastify.register(FriendRoutes, { prefix: "/api/friends" });
  fastify.register(OauthRoutes, { prefix: "/api/oauth" });
  // fastify.register(checkCodeRoutes, { prefix: "/api" });
  fastify.register(_2faRoutes, { prefix: "/api/2fa" });
  fastify.register(NotificationRoutes, { prefix: "/api/notifications" });



  // Add this with your other route registrations
  fastify.register(AuthRoutes, { prefix: "/api/auth" });
  ///////////////////////////////

  fastify.register(fastifyStatic, {
    root: path.join(__dirname, "uploads"),
    prefix: "/uploads/",
  });

  const PORT = process.env.PORT || 8001;
  const HOST = process.env.HOST || "0.0.0.0";

  function connect() {
    db.sequelize
      .sync()
      .then(() => {
        console.log("Database connected successfully");
        db.Session.update({ counter: 0 }, { where: { } });
        return fastify.listen({ port: PORT, host: HOST });
      })
      .then(() => {
        console.log(`Server is running on port ${PORT}`);
      })
      .catch((err) => {
        require(`${process.env.PROJECT_PATH}/util/catch`)(err);
      });
  }
  connect();

}
catch (err) {
  require(`${process.env.PROJECT_PATH}/util/catch`)(err);
}

