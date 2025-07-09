const fastify = require("fastify")();
const db = require("../../models");
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("../../middleware/Multer");
const jwt_secret = process.env.JWT_SECRET || "your_jwt_secret";
const time_token_expiration = process.env.TIME_TOKEN_EXPIRATION || "10h";

const validation = (body, reply) => {
  if (!body) {
    return reply.status(400).send({ error: "Request body is required" });
  }

  const { username, password, email,name } = body;

  if (!username || !password || !email || !name) {
    return reply
      .status(400)
      .send({ error: "Username, password, and email are required" });
  }

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof email !== "string" ||
    typeof name !== "string"
  ) {
    return reply
      .status(400)
      .send({ error: "Username, password, email, and name must be strings" });
  }
  const nameParts = name.split(" ");
  if (!/^[a-zA-Z_]+$/.test(username)) {
    return reply
      .status(400)
      .send({ error: "Username must contain only letters, numbers, and underscores" });
  }
  if (username.length < 3 || password.length < 6 || !email.includes("@") || nameParts.length != 2 || nameParts[0].length < 3 || nameParts[1].length < 3) {
    return reply
      .status(400)
      .send({ error: "Invalid username, password, email, or name format" });
  }

  return null;
};

const register =  (request, reply) => {
  try {
    multer(request).then((body) => {
    const validationError = validation(body, reply);

    if (validationError) return validationError;

    const { username, password, email, image , name } = body;
    let path = image ? image.path : "uploads/default_profile_picture.png";
    db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ username: username }, { email: email }],
      },
    })
      .then((user) => {
        if (user) {
          return reply.status(400).send({
            error: `${
              user.username === username ? "Username" : "Email"
            } already exists`,
          });
        }
      })
      .catch((error) => {
        return reply.status(500).send({ message: "Internal server error" });
      });

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.User.create({
      username,
      password: hashedPassword,
      email,
      image: path || null,
      name
    })
      .then((user) => {

        const token = jsonwebtoken.sign(
          {id: user.id, username: user.username, email: user.email },
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
              name
            });
          }
        );
      })
      .catch((error) => {
        console.error("Error creating user:", error);
        return reply.status(500).send({ message: "Internal server error" });
      });
    }).catch((error) => {
      console.error("Error processing multipart request:", error);
      return reply.status(500).send({ message: "Failed to process multipart request" });
    });
  } catch (err) {
    console.error("Unexpected error during registration:", err);
    return reply.status(500).send({ message: "Internal server error" });
  }
};

module.exports = register;
