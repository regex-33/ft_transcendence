const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { logger } = require("../../util/logger");

const getSessions = async (req, res) => {
  try {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { id, username } = req.user;

    const sessions = await db.Session.findAll({
      where: {
        userId: id
      },
      order: [['updatedAt', 'DESC']]
    });

    const sessionData = sessions.map(session => ({
      id: session.SessionId,
      lastActive: session.updatedAt,
      isActive: session.counter > 0
    }));

    res.status(200).send({ sessions: sessionData });
  } catch (err) {
    console.error("Error fetching sessions:", err.message);
    res.status(500).send({ error: "Internal server error" });
  }
};



const terminateSession = async (req, res) => {
  try {
    const { check, payload, session } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { id, username } = req.user;
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).send({ error: "Session ID is required" });
    }


    const session_ = await db.Session.findOne({
      where: {
        SessionId: sessionId,
        userId: id
      }
    });

    if (!session_) {
      return res.status(404).send({ error: "Session not found" });
    }


    if (session && session.id === parseInt(sessionId)) {
      return res.status(400).send({ error: "Cannot terminate your current session" });
    }

    await session_.destroy();
    logger(req, "INFO", "terminateSession", username, true, null, req.cookies?.token || null);
    res.status(200).send({ message: "Session terminated successfully" });
  } catch (err) {
    console.error("Error terminating session:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};


const terminateAllOtherSessions = async (req, res) => {
  try {
    const { check, payload, session } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { id, username } = req.user;


    await db.Session.destroy({
      where: {
        userId: id,
        id: { [db.Sequelize.Op.ne]: session.sessionId }
      }
    });

    logger(req, "INFO", "terminateAllOtherSessions", username, true, null, req.cookies?.token || null);
    res.status(200).send({ message: "All other sessions terminated successfully" });
  } catch (err) {
    console.error("Error terminating sessions:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};

module.exports = {
  getSessions,
  terminateSession,
  terminateAllOtherSessions
};
