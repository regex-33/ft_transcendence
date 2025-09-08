const uuid = require("uuid").v4;
const db = require("../models");
module.exports = (reply, token, userId) => {
  reply.setCookie("token", token, {
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
  });
  const session_id = uuid();
  console.log("Creating session:", { sessionId: session_id, userId });
  db.Session.create({ SessionId: session_id, userId });
  reply.setCookie("session_id", session_id, {
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
  });
  return reply;
}
