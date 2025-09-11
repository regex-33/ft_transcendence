const jwt = require("./jwt");
const Cookie = require("./cookie");
const { fillObject } = require("./logger");
const db = require('../models');
const checkAuthJWT = async (req, reply) => {
  const { token, session_id } = req.cookies;

  if (!token || !session_id) {
    fillObject(req, "WARNING", "checkjwt", "unknown", false, "no token", req.Cookies?.token || null);
    return { check: reply.status(401).send({ error: "No token provided" }) };
  }

  return await jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      fillObject(req, "WARNING", "checkjwt", "unknown", false, err, req.Cookies?.token || null);

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
      fillObject(req, "WARNING", "checkjwt", "unknown", false, err, req.Cookies?.token || null);

      return {
        check: reply.status(401).send(
          { error: "Invalid session id" }
        )
      };
    }
    if (decoded.token) {
      return { check: Cookie(reply, decoded.token, decoded.payload.id) };
    }

    return { payload: decoded.payload ,session};
  });
}

module.exports = checkAuthJWT;