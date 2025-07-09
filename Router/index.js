const login = require("./Users/login");
const register = require("./Users/register");
const actionsHandler = require("./Friends/actionsHandler");
const addFriend = require("./Friends/addFriend.js");
const {
    getbyusername,
    getbyId,
} = require("./Users/getters");
const updateUser = require("./Users/update");

async function UserRoutes(fastify, options) {
  fastify.post("/register", register);
  fastify.post("/login", login);
  fastify.put("/users/update", updateUser);
  fastify.get("/users/:username", getbyusername);
  fastify.get("/users/id/:id", getbyId);

}

async function FriendRoutes(fastify, options) {
  fastify.post("/friends/add", addFriend);
  fastify.post("/friends/actions", actionsHandler);
}


module.exports = {UserRoutes, FriendRoutes};
