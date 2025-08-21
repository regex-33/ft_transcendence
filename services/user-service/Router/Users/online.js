const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");
const isOnline = async (req, res) => {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { username } = req.user;
    const online = await getUserOnline(username);
    if (online !== null) {
        fillObject(req, "INFO", "isOnline", req.user.id, true, "", req.cookies?.token || null);
        return res.status(200).send({ online: !!online });
    }
    fillObject(req, "WARNING", "isOnline", "unknown", false, "User not found", req.cookies?.token || null);
    return res.status(404).send("user not found");
};

const getUserOnline = async (username) => {
    try {
        const user = await db.User.findOne({ where: { username } });
        if (user) {
            return user.online;
        }
    } catch (error) {
        console.error("Error fetching user online status:", error);
        return null;
    }
    return null;
};

const setOnline = async (req, res) => {
    try {
        const { check, payload } = await checkAuthJWT(req, res);
        if (check) return check;
        req.user = payload;
        const { isOnline } = req.body;
        
        if (isOnline === undefined) {
            fillObject(req, "WARNING", "setOnline", "unknown", false, "isOnline is required", req.cookies?.token || null);
            return res.status(400).send({"message": "isOnline is required"});
        }
        
        const { username } = req.user;
        if (isOnline !== false && isOnline !== true) {
            fillObject(req, "WARNING", "setOnline", username, false, "isOnline must be 0 or 1", req.cookies?.token || null);
            return res.status(400).send({"message": "isOnline must be boolean"});
        }

        r = setUserOnline(username, isOnline,res,req)
        if (r !== false)
            return r;

        fillObject(req, "WARNING", "setOnline", username, false, "User not found", req.cookies?.token || null);
        return res.status(404).send({"message": "User not found"});
    } catch (error) {
        fillObject(req, "ERROR", "setOnline", "unknown", false, error.message, req.cookies?.token || null);
        return res.status(500).send({"message": "Internal server error"});
    }
};

const setUserOnline = async (username, isOnline,res,req) => {
    try {
        const user = await db.User.findOne({ where: { username } });
        if (user) {
            user.online += isOnline ? 1 : -1;
            if (user.online != req.body.online) {
                await user.save();
            }
            fillObject(req, "INFO", "setOnline", user.id, true, "", req.cookies?.token || null);
            return res.status(200).send({ online: !!req.body.isOnline });
        }
    } catch (error) {
        fillObject(req, "ERROR", "setOnline", username, false, error.message, req.cookies?.token || null);
        return res.status(500).send({"message": "Internal server error"});
    }
    return false;
}

module.exports = { isOnline, setOnline };