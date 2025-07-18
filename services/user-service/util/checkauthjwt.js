const jwt = require("./jwt");

const checkAuthJWT = (req, reply) => {
  const token = req.cookies?.token;

  if (!token) {
    fillObject(req,"WARNING", "create2fa", "unknown",false,"no token",req.Cookies?.token || null);
    return reply.status(401).send({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      fillObject(req,"WARNING", "create2fa", "unknown",false,"invalid token",req.Cookies?.token || null);
      return reply.status(401).send(
        { error: "Invalid token" }
      );
    }
    req.user = decoded;
    return false;
  });
}

module.exports = checkAuthJWT;