const jwt = require("./jwt");
const Cookie = require("./cookie");
const db = require('../models');
const checkAuthJWT = async (req, reply) => {
  const { token, session_id } = req.cookies;

  if (!token || !session_id) {
    return { check: reply.status(401).send({ error: "No token provided" }) };
  }
  return await jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return {
        check: reply.status(401).send(
          { error: "Invalid token" }
        )
      };
    }
    req.user = decoded.payload;
    const session = await db.Session.findOne({
      where: {
        SessionId: session_id,
        userId: decoded.payload.id
      }
    });
    if (!session) {
      return {
        check: reply.status(401).send(
          { error: "Invalid session id" }
        )
      };
    }
    if (decoded.token) {
      return { check: Cookie(reply, decoded.token, decoded.payload.id) };
    }

    return { payload: decoded.payload, session };
  });
}

module.exports = checkAuthJWT;