const db = require("../../models");
const jsonwebtoken = require("../../util/jwt");
const bcrypt = require("bcrypt");
const Cookies = require("../../util/cookie");
const { logger  } = require("../../util/logger");

const jwt_secret = process.env.JWT_SECRET || "your_jwt_secret";
const time_token_expiration = process.env.TIME_TOKEN_EXPIRATION || "10h";

const validation = (body, reply) => {
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
    const validationError = validation(request.body, reply);
    if (validationError) {
      return validationError;
    }

    const { username, password, email, avatar } = request.body;
    let path = avatar ? avatar.path : `${request.protocol}://${request.headers.host}/uploads/default.jpg`;

    if (await checkUserExisting(reply, username, email, request)) return;

    return await createUser(request, reply, {
      username,
      password: bcrypt.hashSync(password, 10),
      email,
      avatar: path || null
    });

  } catch (error) {
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
      logger(request, "ERROR", "register", userInfo.username, false, "TokenGenerationFailed", reply.cookies?.token || null);
      return reply.status(500).send({ error: "Error generating token" });
    }

    logger(request, "INFO", "register", userInfo.username, true, null, reply.cookies?.token || null);
    return Cookies(reply, token, user.id).redirect(process.env.HOME_PAGE);
  } catch (error) {
    logger(request, "ERROR", "register", userInfo.username, false, "UserCreationFailed", reply.cookies?.token || null);
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
      reply.status(400).send({
        error: `${user.username === username ? "Username" : "Email"} already exists`,
      });
      return true;
    }
    return;
  } catch (error) {
    return reply.status(500).send({ message: "Internal server error" });
  }
}

module.exports = register;
