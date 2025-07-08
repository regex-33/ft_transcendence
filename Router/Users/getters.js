const db = require("../../models");
const jsonwebtoken = require("jsonwebtoken");
const checkAuthJWT = require("../../middleware/checkauthjwt");
const getbyusername = (request, reply) => {
  const check = checkAuthJWT(request, reply);
  if (check) return check;
  if (!request.params || !request.params.username) {
    return reply.status(400).send({ error: "Username is required." });
  }
  const { username } = request.params;

  if (!/^[a-zA-Z_]+$/.test(username)) {
    return reply.status(400).send({ error: "Invalid username format." });
  }

  db.User.findOne({ where: { username } })
    .then((user) => {
      if (!user) {
        return reply.status(404).send({ error: "User not found." });
      }
      reply.send({
        id: user.id,
        username: user.username,
        email: user.email,
        image: user.image,
        name: user.name,
        bio: user.bio,
      });
    })
    .catch((err) => {
      console.error("Error fetching user by username:", err);
      reply.status(500).send({ error: "Internal server error." });
    });
};

const getbyId = (request, reply) => {
  const { id } = request.params;
  if (!id) {
    return reply.status(400).send({ error: "User ID is required." });
  }
  if (!/^\d+$/.test(id)) {
    return reply.status(400).send({ error: "Invalid user ID format." });
  }

  db.User.findByPk(id)
    .then((user) => {
      if (!user) {
        return reply.status(404).send({ error: "User not found." });
      }
      reply.send({
        id: user.id,
        username: user.username,
        email: user.email,
        image: user.image,
        name: user.name,
        bio: user.bio,
      });
    })
    .catch((err) => {
      console.error("Error fetching user by ID:", err);
      reply.status(500).send({ error: "Internal server error." });
    });
};

module.exports = {
  getbyusername,
  getbyId,
};
