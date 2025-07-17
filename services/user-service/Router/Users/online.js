const db = require("../../models");
const checkAuthJWT = require("../../middleware/checkauthjwt");
const isOnline = async (req, res) => {
    const authError = checkAuthJWT(req, res);
    if (authError) {
        return res.status(401).send(authError);
    }
    const { username } = req.user;
    const user = await db.User.findOne({ where: { username } });
    if (user) {
        return res.status(200).send({ online: user.online });
    }
    return res.status(200).send({ online: false });
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
        return res.status(200).send({ online: req.body.online });
    }
    return res.status(404).send("User not found");
};

module.exports = { isOnline, setOnline };