const checkAuthJWT = require("../../middleware/checkauthjwt");
module.exports = async (req, res) => {
    const authError = checkAuthJWT(req, res);
    if (authError) {
        return res.status(401).send(authError);
    }
    const { username } = req.user;
    console.log(`User ${username} logged out successfully`);
    const user = await User.findOne({ where: { username } });
    if (!user) {
        return res.status(404).send('User not found');
    }
    user.online = false;
    await user.save();
    res.clearCookie('token');
    res.redirect('/login');
};