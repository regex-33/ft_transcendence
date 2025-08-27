const checkAuthJWT = require("../../util/checkauthjwt");
const { User } = require("../../models");
const { fillObject } = require("../../util/logger");

module.exports = async (req, res) => {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { username } = req.user;
    const user = await User.findOne({ where: { username } });
    if (!user) {
        fillObject(req, "WARNING", "logout", username, false, "User not found", req.cookies?.token || null);
        return res.status(404).send('User not found');
    }
    user.online = false;
    await user.save();
    fillObject(req, "INFO", "logout", user.id, true, "", req.cookies?.token || null);
    res.clearCookie('token');
    res.redirect('/login');
};