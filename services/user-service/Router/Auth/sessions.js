const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");

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
      sessionId: session.SessionId,
      lastActive: session.updatedAt,
      isActive: session.counter > 0
    }));

    fillObject(req, "INFO", "getSessions", username, true, "", req.cookies?.token || null);
    res.status(200).send({ sessions: sessionData });
  } catch (err) {
    fillObject(req, "ERROR", "getSessions", "unknown", false, err.message, req.cookies?.token || null);
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
      fillObject(req, "WARNING", "terminateSession", username, false, "Session ID is required", req.cookies?.token || null);
      return res.status(400).send({ error: "Session ID is required" });
    }

    
    const session_ = await db.Session.findOne({
      where: {
        SessionId: sessionId,
        userId: id
      }
    });

    if (!session_) {
      fillObject(req, "WARNING", "terminateSession", username, false, "Session not found", req.cookies?.token || null);
      return res.status(404).send({ error: "Session not found" });
    }

    
    if (session && session.id === parseInt(sessionId)) {
      fillObject(req, "WARNING", "terminateSession", username, false, "Cannot terminate current session", req.cookies?.token || null);
      return res.status(400).send({ error: "Cannot terminate your current session" });
    }

    
    await db.Session.destroy({
      where: {
        id: sessionId,
        userId: id
      }
    });

    fillObject(req, "INFO", "terminateSession", username, true, "", req.cookies?.token || null);
    res.status(200).send({ message: "Session terminated successfully" });
  } catch (err) {
    fillObject(req, "ERROR", "terminateSession", "unknown", false, err.message, req.cookies?.token || null);
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

    fillObject(req, "INFO", "terminateAllOtherSessions", username, true, "", req.cookies?.token || null);
    res.status(200).send({ message: "All other sessions terminated successfully" });
  } catch (err) {
    fillObject(req, "ERROR", "terminateAllOtherSessions", "unknown", false, err.message, req.cookies?.token || null);
    console.error("Error terminating sessions:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};

module.exports = {
  getSessions,
  terminateSession,
  terminateAllOtherSessions
};
