const checkAuthJWT = require("../../util/checkauthjwt");
const db = require("../../models");
const { logger } = require("../../util/logger");
const jwt = require("../../util/jwt");
module.exports = async (req, res) => {
    const { token, session_id } = req.cookies;
    if (token && session_id) {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "my_secret", async (err, payload) => { return err ? null : payload; });
        const session = await db.Session.findOne({ where: { SessionId: session_id } });
        if (payload && session && session.userId === payload.id) {
            await db.Session.destroy({ where: { SessionId: session_id, userId: payload.id } });
            logger(req, "INFO", "logout", payload.username, true, null, req.cookies?.token || null);
        }
    }
    res.clearCookie('token');
    res.clearCookie('session_id');
    return res.redirect('/login');
};
