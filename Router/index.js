const login = require("./Users/login");
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
const checkcode = require("./Users/checkcode");
const _2fa = require("./2fa");

async function UserRoutes(fastify, options) {
  fastify.post("/register", register);
  fastify.post("/login", login);
  fastify.put("/users/update", updateUser);
  fastify.get("/users/:username", getbyusername);
  fastify.get("/users/id/:id", getbyId);
  fastify.get("/users", getUsers);
}

async function FriendRoutes(fastify, options) {
  fastify.post("/friends/add", addFriend);
  fastify.post("/friends/actions", actionsHandler);
  fastify.get("/friends", getFriends);
}

async function OauthRoutes(fastify, options) {
  fastify.get("/auth/github", github.redirect);
  fastify.get("/auth/github/callback", github.handleAuthCallback);
  fastify.get("/auth/intra", intra.redirect);
  fastify.get("/auth/intra/callback", intra.handleAuthCallback);
  fastify.get("/auth/google", google.redirect);
  fastify.get("/auth/google/callback", google.handleAuthCallback);
}

async function checkCodeRoutes(fastify, options) {
  fastify.post("/sendcode", checkcode.send_code);
  fastify.post("/checkcode", checkcode.check_code);
}

async function _2faRoutes(fastify, options) {
  fastify.get("/2fa/generate/:username", _2fa.create2fa);
  fastify.post("/2fa/verify", _2fa.verify2fa);
}

module.exports = { UserRoutes, FriendRoutes, OauthRoutes, checkCodeRoutes, _2faRoutes };
