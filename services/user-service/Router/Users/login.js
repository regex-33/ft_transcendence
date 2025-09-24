const db = require("../../models");
const jwt = require("../../util/jwt");
const bcrypt = require("bcrypt");
const Cookies = require("../../util/cookie");
const { JWT_SECRET, TIME_TOKEN_EXPIRATION } = process.env;
const { logger } = require("../../util/logger");
const speakeasy = require("speakeasy");
const { usernamevalid, passwordvalid } = require("../../util/validaters");
const login = async (request, reply) => {
  try {
    if (!request.body) {
      return reply
        .status(400)
        .send({ error: "Username and password are required." });
    }

    const { username, password, twoFA: code } = request.body;

    if (!usernamevalid(username) || !passwordvalid(password)) {
      return reply.status(400).send({ error: "Invalid username or password format." });
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
        require(`${process.env.PROJECT_PATH}/util/catch`)(error);
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
      require(`${process.env.PROJECT_PATH}/util/catch`)(err);
      reply.status(500).send({ error: "Internal server error." });
    }
  } catch (error) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(error);
    return reply.status(500).send({ error: "Internal server error." });
  }
};

module.exports = login;


