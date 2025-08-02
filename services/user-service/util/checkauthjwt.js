const jwt = require("./jwt");
const Cookie = require("./cookie");
const { fillObject } = require("./logger");
const checkAuthJWT = async (req, reply) => {
  const token = req.cookies?.token;

  if (!token) {
    fillObject(req, "WARNING", "create2fa", "unknown", false, "no token", req.Cookies?.token || null);
    return { check: reply.status(401).send({ error: "No token provided" }) };
  }
  return await jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {

    if (err) {
      fillObject(req, "WARNING", "create2fa", "unknown", false, err, req.Cookies?.token || null);

      return {
        check: reply.status(401).send(
          { error: "Invalid token" }
        )
      };
    }
    req.user = decoded.payload;
    if (decoded.token) {
      return { check: Cookie(reply, decoded.token) };
    }
    return { payload: decoded.payload };
  });
}

module.exports = checkAuthJWT;