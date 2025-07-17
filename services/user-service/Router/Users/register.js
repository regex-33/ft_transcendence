const fastify = require("fastify")();
const db = require("../../models");
const jsonwebtoken = require("../../util/jwt");
const bcrypt = require("bcrypt");
const multer = require("../../util/Multer");
const jwt_secret = process.env.JWT_SECRET || "your_jwt_secret";
const time_token_expiration = process.env.TIME_TOKEN_EXPIRATION || "10h";
const Cookies = require("../../util/cookie");
const validation = (body, reply) => {
  if (!body) {
    console.error("Request body is missing");
    return reply.status(400).send({ error: "Request body is required" });
  }

  const { username, password, email} = body;

  if (!username || !password || !email ) {
    console.error("Missing required fields:", { username, password, email });
    return reply
      .status(400)
      .send({ error: "Username, password, and email are required" });
  }

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof email !== "string" 
  ) {
    console.error("Invalid field types:", {
      username: typeof username,
      password: typeof password,
      email: typeof email,
    });
    return reply
      .status(400)
      .send({ error: "Username, password, email,   must be strings" });
  }

  if (
    username.length < 3 ||
    password.length < 6 ||
    !email.includes("@") 
  ) {
    return reply
      .status(400)
      .send({ error: "Invalid username, password, email format" });
  }

  return null;
};

const register = async (request, reply) => {
  try {
    let body;
    try {
      body = request.body;
      
      if (!body) {
        console.error("No data received in request body");
        return reply.status(400).send({ error: "No data received" });
      }
    } catch (error) {
      console.error("Error processing multipart request:", error.message);
      return reply
        .status(500)
        .send({ message: "Failed to process multipart request" });
    }
    const validationError = validation(body, reply);

    if (validationError) return validationError;

    const { username, password, email, image } = body;
    let path = image ? image.path : `${request.protocol}://${request.headers.host}/uploads/default_profile_picture.png`;
    try {
      const user = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [{ username: username }, { email: email }],
        },
      });

      if (user) {
        return reply.status(400).send({
          error: `${user.username === username ? "Username" : "Email"} already exists`,
        });
      }
    } catch (error) {
      console.error("Error checking user existence:", error.message);
      return reply.status(500).send({ message: "Internal server error" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      const user = await db.User.create({
        username,
        password: hashedPassword,
        email,
        image: path || null
      });
      const token = await jsonwebtoken.sign(
        { id: user.id, username: user.username, email: user.email },
        jwt_secret,
        { expiresIn: time_token_expiration }
      );
      if (!token)
        return reply.status(500).send({ error: "Error generating token" });

      return Cookies(reply, token).status(201).send({});
    } catch (error) {
      console.error("Error creating user:", error.message);
      return reply.status(500).send({ message: "Internal server error" });
    }
  } catch (error) {
    console.error("Error in register handler:", error.message);
    return reply.status(500).send({ message: "Internal server error" });
  }
};

module.exports = register;
