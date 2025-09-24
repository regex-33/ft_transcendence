const uuid = require("uuid").v4;
const { logger } = require("./logger");
const db = require("../models");
module.exports = (reply, token, userId) => {
  const session_id = uuid();
  try {
    db.Session.create({ SessionId: session_id, userId });
    logger(null, "INFO", "createSession", userId, true, null, token);
  } catch (error) {
    logger(null, "ERROR", "createSession", userId, false, "SessionCreationFailed", token);
    require(`${process.env.PROJECT_PATH}/util/catch`)(error);
    return reply.status(500).send({ error: "Internal server error." });
  }
  reply.setCookie("session_id", session_id, {
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
  });
  reply.setCookie("token", token, {
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
  });
  return reply;
}
