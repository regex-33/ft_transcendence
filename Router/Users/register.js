const fastify = require("fastify")();
const db = require("../../models");
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const jwt_secret = process.env.JWT_SECRET || "your_jwt_secret";
const time_token_expiration = process.env.TIME_TOKEN_EXPIRATION || "10h";

const validation = (request, reply) => {
  if (!request.body) {
    return reply.status(400).send({ error: "Request body is required" });
  }

  const { username, password, email } = request.body;

  if (!username || !password || !email) {
    return reply
      .status(400)
      .send({ error: "Username, password, and email are required" });
  }

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof email !== "string"
  ) {
    return reply
      .status(400)
      .send({ error: "Username, password, and email must be strings" });
  }

  if (username.length < 3 || password.length < 6 || !email.includes("@")) {
    return reply
      .status(400)
      .send({ error: "Invalid username, password, or email format" });
  }

  return null;
};

const register = (request, reply) => {
  try {
    const validationError = validation(request, reply);

    if (validationError) return validationError;

    const { username, password, email } = request.body;

    db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ username: username }, { email: email }],
      },
    })
      .then((user) => {
        if (user) {
          return reply
            .status(400)
            .send({
              error: `${
                user.username === username ? "Username" : "Email"
              } already exists`,
            });
        }
      })
      .catch((error) => {
        return reply.status(500).send({ error: "Internal server error" });
      });

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.User.create({ username, password: hashedPassword, email })
      .then(() => {
        const token = jsonwebtoken.sign(
          { username, email },
          jwt_secret,
          { expiresIn: time_token_expiration },
          (error, token) => {
            if (error)
              return reply
                .status(500)
                .send({ error: "Error generating token" });

            return reply.send({
              message: `User ${username} registered successfully!`,
              email,
              token,
            });
          }
        );
      })
      .catch((error) => {
        return reply.status(500).send({ error: "Internal server error" });
      });
  } catch (error) {
    console.error("Unexpected error during registration:", error);
    return reply.status(500).send({ error: "Internal server error" });
  }
};

module.exports = register;
