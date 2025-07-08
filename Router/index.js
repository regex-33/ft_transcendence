const login = require("./Users/login");
const register = require("./Users/register");
const checkAuthJWT = require("../middleware/checkauthjwt");
const {
    getbyusername,
    getbyId,
} = require("./Users/getters");
async function UserRoutes(fastify, options) {
  fastify.post("/register", register);
  fastify.post("/login", login);
  fastify.get("/users/:username", getbyusername);
  fastify.get("/users/id/:id", getbyId);

}

module.exports = UserRoutes;
