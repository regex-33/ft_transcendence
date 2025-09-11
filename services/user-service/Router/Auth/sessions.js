// services/user-service/Router/Auth/sessions.js
const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");

// Get all active sessions for the current user
const getSessions = async (req, res) => {
  try {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { id, username } = req.user;

    const sessions = await db.Session.findAll({
      where: { 
        userId: id,
        counter: { [db.Sequelize.Op.gt]: 0 } // Only active sessions
      },
      order: [['updatedAt', 'DESC']]
    });

    const sessionData = sessions.map(session => ({
      id: session.id,
      sessionId: session.SessionId,
      lastActive: session.updatedAt,
      // You can add more fields like IP address, user agent if stored
      deviceInfo: 'Unknown device', // Placeholder - add this field to Session model if needed
      ipAddress: 'Unknown location', // Placeholder - add this field to Session model if needed
      userAgent: req.headers['user-agent'] || 'Unknown'
    }));

    fillObject(req, "INFO", "getSessions", username, true, "", req.cookies?.token || null);
    res.status(200).send({ sessions: sessionData });
  } catch (err) {
    fillObject(req, "ERROR", "getSessions", "unknown", false, err.message, req.cookies?.token || null);
    console.error("Error fetching sessions:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};


// Terminate a specific session
const terminateSession = async (req, res) => {
  try {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { id, username } = req.user;
    const { sessionId } = req.params;

    if (!sessionId) {
      fillObject(req, "WARNING", "terminateSession", username, false, "Session ID is required", req.cookies?.token || null);
      return res.status(400).send({ error: "Session ID is required" });
    }

    // Find the session
    const session = await db.Session.findOne({
      where: { 
        id: sessionId,
        userId: id 
      }
    });

    if (!session) {
      fillObject(req, "WARNING", "terminateSession", username, false, "Session not found", req.cookies?.token || null);
      return res.status(404).send({ error: "Session not found" });
    }

    // Check if it's the current session
    const currentSession = await checkAuthJWT(req, res);
    if (currentSession.session && currentSession.session.id === parseInt(sessionId)) {
      fillObject(req, "WARNING", "terminateSession", username, false, "Cannot terminate current session", req.cookies?.token || null);
      return res.status(400).send({ error: "Cannot terminate your current session" });
    }

    // Terminate the session
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

// Terminate all other sessions (keep current one)
const terminateAllOtherSessions = async (req, res) => {
  try {
    const { check, payload, session } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { id, username } = req.user;

    // Terminate all sessions except the current one
    await db.Session.destroy({
      where: {
        userId: id,
        id: { [db.Sequelize.Op.ne]: session.id } // Exclude current session
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
