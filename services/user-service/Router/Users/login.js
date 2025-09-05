const fastify = require("fastify")();
const db = require("../../models");
const jwt = require("../../util/jwt");
const bcrypt = require("bcrypt");
const Cookies = require("../../util/cookie");
const { fillObject } = require("../../util/logger");
const { JWT_SECRET, TIME_TOKEN_EXPIRATION } = process.env;

const validateInputs = (req,username, password) => {
  if (!username || !password) {
    fillObject(req, "WARNING", "login", "unknown", false, "Username and password are required.", req.cookies?.token || null);
    return { valid: false, message: "Username and password are required." };
  }
  if (username.length < 3 || password.length < 6) {
    fillObject(req, "WARNING", "login", "unknown", false, "invalid username or password format", req.cookies?.token || null);
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
      fillObject(request, "WARNING", "login", "unknown", false, "Request body is empty", request.cookies?.token || null);
      return reply
        .status(400)
        .send({ error: "Username and password are required." });
    }

    const { username, password } = request.body;
    const validation = validateInputs(request, username, password);

    if (!validation.valid) {
      fillObject(request, "WARNING", "login", "unknown", false, validation.message, request.cookies?.token || null);
      return reply.status(400).send({ error: validation.message });
    }
    try {
      const user = await db.User.findOne({ where: { username } });

      if (!user) {
        fillObject(request, "WARNING", "login", "unknown", false, "Invalid username or password.", request.cookies?.token || null);
        return reply
          .status(401)
          .send({ error: "Invalid username or password." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        fillObject(request, "WARNING", "login", "unknown", false, "Invalid username or password.", request.cookies?.token || null);
        return reply
          .status(401)
          .send({ error: "Invalid username or password." });
      }

      try {
        const TwoFA = await db.TwoFA.findOne({ where: { username } });
        if (TwoFA) {
          fillObject(request, "INFO", "login", user.id, true, "2FA required", request.cookies?.token || null);
          return reply.redirect(`/2fa?username=${username}`);
        }
      } catch (error) {
        console.error("Error fetching 2FA status:", error);
        fillObject(request, "ERROR", "login", user.id, false, error.message, request.cookies?.token || null);
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
        fillObject(request, "ERROR", "login", "unknown", false, "Failed to generate token", request.cookies?.token || null);
        return reply.status(500).send({ error: "Failed to generate token." });
      }
      fillObject(request, "INFO", "login", user.id, true, "", request.cookies?.token || null);
      return Cookies(reply, token, user.id).redirect(process.env.HOME_PAGE);
    } catch (err) {
      fillObject(request, "ERROR", "login", "unknown", false, "Error during login", request.cookies?.token || null);
      console.error("Error during login:", err);
      reply.status(500).send({ error: "Internal server error." });
    }
  } catch (error) {
    fillObject(request, "ERROR", "login", "unknown", false, error.message, request.cookies?.token || null);
    console.error("Unexpected error during login:", error);
    return reply.status(500).send({ error: "Internal server error." });
  }
};

module.exports = login;
