const checkAuthJWT = require("../../util/checkauthjwt");
const db = require("../../models");
const { fillObject } = require("../../util/logger");

module.exports = async (req, res) => {
    const { check, payload, session } = await checkAuthJWT(req, res);
    if (check) return check;
    await db.Session.destroy({ where: { SessionId: session.SessionId, userId: payload.id } });
    fillObject(req, "INFO", "logout", payload.id, true, "", req.cookies?.token || null);
    res.clearCookie('token');
    res.clearCookie('session_id');
    return res.redirect('/login');
};
