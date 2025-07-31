const checkAuthJWT = require("../../util/checkauthjwt");
module.exports = async (req, res) => {
    const authError = checkAuthJWT(req, res);
    if (authError) {
        return res.status(401).send(authError);
    }
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