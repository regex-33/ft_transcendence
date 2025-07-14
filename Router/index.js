const login = require("./login");
const register = require("./Users/register");
const actionsHandler = require("./Friends/actionsHandler");
const addFriend = require("./Friends/addFriend.js");
const github = require("./Oauth/github");
const intra = require("./Oauth/intra");
const google = require("./Oauth/google");
const getFriends = require("./Friends/getFriends");
const {
  getbyusername,
  getbyId,
  getUsers,
} = require("./Users/getters");
const updateUser = require("./Users/update");
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
  fastify.get("/generate/:username", _2fa.create2fa);
  fastify.post("/verify", _2fa.verify2fa);
}

module.exports = { UserRoutes, FriendRoutes, OauthRoutes, checkCodeRoutes, _2faRoutes };
