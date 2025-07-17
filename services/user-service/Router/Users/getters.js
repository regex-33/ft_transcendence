const db = require("../../models");
const jsonwebtoken = require("../../util/jwt");
const checkAuthJWT = require("../../util/checkauthjwt");

  /**
     * return user obj,
     * get user by username
     */
const getbyusername = async (request, reply) => {
  const check = checkAuthJWT(request, reply);
  if (check) return check;

  if (!request.params || !request.params.username) {
    return reply.status(400).send({ error: "Username is required." });
  }

  const { username } = request.params;

  if (!/^[a-zA-Z_]+$/.test(username)) {
    return reply.status(400).send({ error: "Invalid username format." });
  }

  try {

    const user = await db.User.findOne({ where: { username } });
    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }
    reply.send({
      id: user.id,
      username: user.username,
      email: user.email,
      image: user.image,
      bio: user.bio,
    });
  }
  catch (err) {
    console.error("Error fetching user by username:", err);
    reply.status(500).send({ error: "Internal server error." });
  };
};


  /**
     * return user obj,
     * get user by id
     */
const getbyId = (request, reply) => {
  const check = checkAuthJWT(request, reply);
  if (check) return check;
  let { id } = request.params;
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
        bio: user.bio,
      });
    })
    .catch((err) => {
      console.error("Error fetching user by ID:", err);
      reply.status(500).send({ error: "Internal server error." });
    });
};



  /**
     * return  all users objs,
     * 
     */
const getUsers = async (request, reply) => {
  const check = checkAuthJWT(request, reply);
  if (check) return check;
  try {
    const users = await db.User.findAll();
    if (!users || users.length === 0) {
      return reply.status(404).send({ error: "No users found." });
    }
    return reply.send(
      users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        image: user.image,
        bio: user.bio,
      }))
    );
  }
  catch (err) {
    console.error("Error fetching users:", err);
    reply.status(500).send({ error: "Internal server error." });
  };
};

module.exports = {
  getbyusername,
  getbyId,
  getUsers,
};
