const fastify = require("fastify")();
const db = require("../../models");
const jwt = require("../../util/jwt");
const bcrypt = require("bcrypt");
const Cookies = require("../../util/cookie");
const { JWT_SECRET, TIME_TOKEN_EXPIRATION } = process.env;
const { logger } = require("../../util/logger");

const validateInputs = (req, username, password) => {
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

const login = async (request, reply) => {
  try {
    if (!request.body) {
      return reply
        .status(400)
        .send({ error: "Username and password are required." });
    }

    const { username, password, code } = request.body;
    const validation = validateInputs(request, username, password);

    if (!validation.valid) {

      return reply.status(400).send({ error: validation.message });
    }
    try {
      const user = await db.User.findOne({ where: { username } });

      if (!user) {
        return reply
          .status(401)
          .send({ error: "Invalid username or password." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger(request, "WARNING", "login", username, false, "InvalidPassword", request.cookies?.token || null);
        return reply
          .status(401)
          .send({ error: "Invalid username or password." });
      }

      try {
        const TwoFA = await db.TwoFA.findOne({ where: { userId: user.id } });
        if (TwoFA && TwoFA.isActive) {
          if (!code) {
            return reply
              .status(401)
              .send({ error: "2FA code is required." });
          }
          const verified = speakeasy.totp.verify({
            secret: TwoFA.secret,
            encoding: 'base32',
            token: code,
            window: 1
          });
          if (!verified) {
            logger(request, "WARNING", "login", username, false, "Invalid2FACode", request.cookies?.token || null);
            return reply
              .status(401)
              .send({ error: "Invalid 2FA code." });
          }
        }
      } catch (error) {
        console.log("Error fetching 2FA status:", error);
        return reply
          .status(500)
          .send({ error: "Internal server error " });
      }
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: TIME_TOKEN_EXPIRATION }
      );

      if (!token) {
        logger(request, "ERROR", "login", username, false, "TokenGenerationFailed", request.cookies?.token || null);
        return reply.status(500).send({ error: "Failed to generate token." });
      }
      logger(request, "INFO", "login", username, true, null, request.cookies?.token || null);
      return Cookies(reply, token, user.id).redirect(process.env.HOME_PAGE);
    } catch (err) {
      logger(request, "ERROR", "login", username, false, "LoginFailed", request.cookies?.token || null);
      console.error("Error during login:", err);
      reply.status(500).send({ error: "Internal server error." });
    }
  } catch (error) {
    console.error("Unexpected error during login:", error);
    return reply.status(500).send({ error: "Internal server error." });
  }
};

module.exports = login;


