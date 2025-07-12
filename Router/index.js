const login = require("./Users/login");
const register = require("./Users/register");
const actionsHandler = require("./Friends/actionsHandler");
const addFriend = require("./Friends/addFriend.js");
const github = require("./Oauth/github");
const intra = require("./Oauth/intra");
const {
    getbyusername,
    getbyId,
    getUsers,
} = require("./Users/getters");
const updateUser = require("./Users/update");

const checkcode = require("./Users/checkcode");

const GITHUB_CLIENT_ID = "Ov23li9XghxCIA1SbDTu";
const GITHUB_CLIENT_SECRET = "96dd02f019520463b64fa7ef1170d1cf033404b4";


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
}

async function OauthRoutes(fastify, options) {
  fastify.get("/auth/github", github.redirect);
  fastify.get("/auth/access", github.handleAuthCallback);
  fastify.get("/auth/intra", intra.redirect);
  fastify.get("/auth/intra/callback", intra.handleAuthCallback);
}

async function checkCodeRoutes(fastify, options) {
  fastify.post("/sendcode", checkcode.send_code);
  fastify.post("/checkcode", checkcode.check_code);
}
module.exports = { UserRoutes, FriendRoutes, OauthRoutes, checkCodeRoutes };
