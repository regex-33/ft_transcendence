const fastify = require("fastify")();
const db = require("../../models");
const jwt = require("../../util/jwt");
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

const login = async (request, reply) => {
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
    try {
      const user = await db.User.findOne({ where: { username } });

      if (!user) {
        return reply
          .status(401)
          .send({ error: "Invalid username or password." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return reply
          .status(401)
          .send({ error: "Invalid username or password." });
      }

      try {
        const TwoFA = await db.TwoFA.findOne({ where: { username } });
        if (TwoFA) {
          return reply.send({
            needCode: true,
          });
        }
      } catch (error) {
        console.error("Error fetching 2FA status:", error);
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
        return reply.status(500).send({ error: "Failed to generate token." });
      }

      return Cookies(reply, token).send({});
    } catch (err) {
      console.error("Error during login:", err);
      reply.status(500).send({ error: "Internal server error." });
    }
  } catch (error) {
    console.error("Unexpected error during login:", error);
    return reply.status(500).send({ error: "Internal server error." });
  }
};

module.exports = login;
