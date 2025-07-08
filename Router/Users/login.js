const fastify = require("fastify")();
const db = require("../../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { JWT_SECRET, TIME_TOKEN_EXPIRATION } = process.env;

const validateInputs = (username, password) => {
  if (!username || !password) {
    return { valid: false, message: "Username and password are required." };
  }
  if (username.length < 3 || password.length < 6) {
    return {
      valid: false,
      message:
        "Username must be at least 3 characters and password at least 6 characters long.",
    };
  }
  return { valid: true };
};

const login = (request, reply) => {
  try {
    if (!request.body)
      return reply
        .status(400)
        .send({ error: "Username and password are required." });

    const { username, password } = request.body;
    const validation = validateInputs(username, password);

    if (!validation.valid) {
      return reply.status(400).send({ error: validation.message });
    }

    db.User.findOne({ where: { username } })
      .then((user) => {
        if (!user) {
          return reply
            .status(401)
            .send({ error: "Invalid username or password." });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err)
            return reply.status(500).send({ error: "Internal server error." });

          if (!isMatch)
            return reply
              .status(401)
              .send({ error: "Invalid username or password." });

          const token = jwt.sign(
            { id: user.id, username: user.username , email: user.email },
            JWT_SECRET,
            { expiresIn: TIME_TOKEN_EXPIRATION }
          );

          reply.send({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              image: user.image,
              name: user.name,
            },
            token,
          });
        });
      })
      .catch((err) => {
        console.error("Error during login:", err);
        reply.status(500).send({ error: "Internal server error." });
      });
  } catch (error) {
    console.error("Unexpected error during login:", error);
    return reply.status(500).send({ error: "Internal server error." });
  }
};

module.exports = login;
