const {
  login, getbyusername, getbyId, getUsers, register, updateUser
} = require("./Users");
const {
  addFriend, getFriends, actionsHandler
} = require("./Friends");

const {
  github, intra, google
} = require("./Oauth");

const checkcode = require("./emailconfirm");
const _2fa = require("./2fa");

async function UserRoutes(fastify, options) {
  fastify.post("/register", register);
  fastify.post("/login", login);
  fastify.put("/update", updateUser);
  fastify.get("/:username", getbyusername);
  fastify.get("/id/:id", getbyId);
  fastify.get("/", getUsers);
}

async function FriendRoutes(fastify, options) {
  fastify.post("/add", addFriend);
  fastify.post("/actions", actionsHandler);
  fastify.get("/", getFriends);
}

async function OauthRoutes(fastify, options) {
  fastify.get("/github", github.redirect);
  fastify.get("/github/callback", github.handleAuthCallback);
  fastify.get("/intra", intra.redirect);
  fastify.get("/intra/callback", intra.handleAuthCallback);
  fastify.get("/google", google.redirect);
  fastify.get("/google/callback", google.handleAuthCallback);
}

async function checkCodeRoutes(fastify, options) {
  fastify.post("/sendcode", checkcode.send_code);
  fastify.post("/checkcode", checkcode.check_code);
}

async function _2faRoutes(fastify, options) {
  fastify.get("/generate", _2fa.create2fa);
  fastify.post("/verify", _2fa.verify2fa);
}

module.exports = { UserRoutes, FriendRoutes, OauthRoutes, checkCodeRoutes, _2faRoutes };
