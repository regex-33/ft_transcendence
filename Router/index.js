const login = require("./Users/login");
const register = require("./Users/register");
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

module.exports = UserRoutes;
