const db = require("../../models");
const jsonwebtoken = require("../../util/jwt");
const bcrypt = require("bcrypt");
const Cookies = require("../../util/cookie");
const { fillObject } = require("../../util/logger");

const jwt_secret = process.env.JWT_SECRET || "your_jwt_secret";
const time_token_expiration = process.env.TIME_TOKEN_EXPIRATION || "10h";

const validation = (request, body, reply) => {
  if (!body) {
    return reply.status(400).send({ error: "Request body is required" });
  }

  const { username, password, email } = body;

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
    fillObject(request, "WARNING", "register", "unknown", false, "Invalid data types for username, password, or email", request.cookies?.token || null);
    return reply
      .status(400)
      .send({ error: "Username, password, email,   must be strings" });
  }

  if (
    username.length < 3 ||
    password.length < 6 ||
    !email.includes("@")
  ) {
    fillObject(request, "WARNING", "register", "unknown", false, "Invalid format for username, password, or email", request.cookies?.token || null);
    return reply
      .status(400)
      .send({ error: "Invalid username, password, email format" });
  }

  return null;
};

const register = async (request, reply) => {
  try {
    try {
      if (!request.body) {
        return reply.status(400).send({ error: "No data received" });
      }
    } catch (error) {
      fillObject(request, "ERROR", "register", "unknown", false, error.message, request.cookies?.token || null);
      console.error("Error processing multipart request:", error.message);
      return reply
        .status(500)
        .send({ message: "Failed to process multipart request" });
    }

    const validationError = validation(request, request.body, reply);
    if (validationError) {
      return validationError;
    }

    const { username, password, email, avatar } = request.body;
    let path = avatar ? avatar.path : `${request.protocol}://${request.headers.host}/uploads/default_profile_picture.png`;

    if (await checkUserExisting(reply, username, email, request)) return;

    return await createUser(request, reply, {
      username,
      password: bcrypt.hashSync(password, 10),
      email,
      avatar: path || null
    });

  } catch (error) {
    fillObject(request, "ERROR", "register", "unknown", false, error.message, request.cookies?.token || null);
    console.error("Error in register handler:", error.message);
    return reply.status(500).send({ message: "Internal server error" });
  }
};

async function createUser(request, reply, userInfo) {
  try {
    const user = await db.User.create(userInfo);
    const token = jsonwebtoken.sign(
      { id: user.id, username: user.username, email: user.email },
      jwt_secret,
      { expiresIn: time_token_expiration }
    );
    if (!token) {
      fillObject(request, "ERROR", "register", "unknown", false, "Error generating token", request.cookies?.token || null);
      return reply.status(500).send({ error: "Error generating token" });
    }
    fillObject(request, "INFO", "register", user.id, true, "", request.cookies?.token || null);

    // Set the cookie but return JSON instead of redirecting
    reply = Cookies(reply, token, user.id);
    return reply.status(200).send({ 
      success: true, 
      message: "User registered successfully",
      redirectUrl: process.env.HOME_PAGE || "/home"
    });
  } catch (error) {
    fillObject(request, "ERROR", "register", "unknown", false, error.message, request.cookies?.token || null);
    console.log("Error creating user:", error.message);
    return reply.status(500).send({ message: "Internal server error" });
  }
}

async function checkUserExisting(reply, username, email, request) {
  try {
    const user = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ username: username }, { email: email }],
      },
    });

    if (user) {
      fillObject(request, "WARNING", "register", "unknown", false, `${user.username === username ? "Username" : "Email"} already exists`, request.cookies?.token || null);
      reply.status(400).send({
        error: `${user.username === username ? "Username" : "Email"} already exists`,
      });
      return true;
    }
    return;
  } catch (error) {
    fillObject(request, "ERROR", "register", "unknown", false, error.message, request.cookies?.token || null);
    console.log("Error checking user existence:", error.message);
    return reply.status(500).send({ message: "Internal server error" });
  }
}

module.exports = register;
