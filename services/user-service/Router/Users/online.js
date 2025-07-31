const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const isOnline = async (req, res) => {
    const authError = checkAuthJWT(req, res);
    if (authError) {
        return res.status(401).send(authError);
    }
    const { username } = req.user;
    const user = await db.User.findOne({ where: { username } });
    if (user) {
        fillObject(req, "INFO", "isOnline", user.id, true, "", req.cookies?.token || null);
        return res.status(200).send({ online: user.online });
    }
    fillObject(req, "WARNING", "isOnline", "unknown", false, "User not found", req.cookies?.token || null);
    return res.status(404).send("user not found");
};

const setOnline = async (req, res) => {
    const authError = checkAuthJWT(req, res);
    if (authError) {
        return res.status(401).send(authError);
    }
    let username;
    if (req.body.username) {
        username = req.params.username;
    } else {
        username = req.user.username;
    }

    const user = await db.User.findOne({ where: { username } });
    if (user) {
        if (user.online != req.body.online) {
            user.online = req.body.online;
            await user.save();
        }
        fillObject(req, "INFO", "setOnline", user.id, true, "", req.cookies?.token || null);
        return res.status(200).send({ online: req.body.online });
    }
    fillObject(req, "WARNING", "setOnline", username, false, "User not found", req.cookies?.token || null);
    return res.status(404).send("User not found");
};

module.exports = { isOnline, setOnline };