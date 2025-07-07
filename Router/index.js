const login = require('./Users/login');
const register = require("./Users/register");

async function UserRoutes(fastify, options) {
    fastify.post("/register", register);
    fastify.post("/login", login);
}

module.exports = UserRoutes;
