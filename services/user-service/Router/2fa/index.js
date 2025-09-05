const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { JWT_SECRET, TIME_TOKEN_EXPIRATION } = process.env;
const jwt = require("../../util/jwt");
const { fillObject } = require('../../util/logger');
const Cookies = require("../../util/cookie");

const create2fa = async (req, res) => {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { username } = req.user;
    const secret = speakeasy.generateSecret({
        name: `ft_transcendence (${username})`,
    });

    const [obj, created] = await db.TwoFA.findOrCreate({
        where: { username },
        defaults: { username, secret: secret.base32 },
    });
    if (!obj) {
        return res.status(500).send("Error creating 2FA");
    }
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    if (!qrCodeUrl) {
        return res.status(500).send("Error generating QR code");
    }
    if (!created) {
        obj.secret = secret.base32;
        await obj.save();
    }
    fillObject(req, "INFO", "create2fa", username, true, "", req.cookies?.token || null);
    res.send({ qrCodeUrl });
};

const disable2fa = async (req, res) => {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { username } = req.user;
    const twoFA = await db.TwoFA.findOne({ where: { username } });
    if (!twoFA) {
        fillObject(req, "WARNING", "disable2fa", username, false, "2FA not enabled", req.cookies?.token || null);
        return res.status(404).send("2FA not enabled for this user");
    }
    await db.TwoFA.destroy({ where: { username } });
    fillObject(req, "INFO", "disable2fa", username, true, "", req.cookies?.token || null);
    res.status(200).send("2FA disabled successfully");
};

const verify2fa = async (req, res) => {
    const { username, token } = req.body;
    const user = await db.User.findOne({ where: { username } });
    const twoFA = await db.TwoFA.findOne({ where: { username } });
    if (!twoFA) return res.status(404).send("2FA not enabled for this user");
    if (!user) return res.status(404).send("User not found");

    const verified = speakeasy.totp.verify({
        secret: twoFA.secret,
        encoding: "base32",
        token,
        window: 1
    });

    if (verified) {
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: TIME_TOKEN_EXPIRATION }
        );
        if (!token) {
            return res.status(500).send({ error: "Failed to generate token" });
        }
        fillObject(req, "INFO", "verify2fa", username, true, "", req.cookies?.token || null);
        return Cookies(res, token, user.id).redirect(process.env.HOME_PAGE);
    } else {
        fillObject(req, "WARNING", "verify2fa", username, false, "invalid token", req.cookies?.token || null);
        return res.status(401).send("Invalid token");
    }
};

module.exports = {
    create2fa,
    verify2fa,
    disable2fa
};