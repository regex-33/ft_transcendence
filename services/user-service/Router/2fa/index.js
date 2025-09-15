const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { logger } = require("../../util/logger");

const create2fa = async (req, res) => {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    const { id, username } = payload;

    try {
        const secret = speakeasy.generateSecret({
            name: `ft_transcendence (${username})`,
        });

        const _2fa = await db.TwoFA.findOne({ where: { userId: id } });
        if (!_2fa) {
            await db.TwoFA.create({
                userId: id,
                secret: secret.base32
            });
        }
        else if (_2fa && _2fa.isActive == false) {
            await db.TwoFA.update({ secret: secret.base32, isActive: false }, { where: { userId: id } });
        } else {
            return res.status(400).send("2FA is already enabled");
        }
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
        if (!qrCodeUrl) {
            return res.status(500).send("Error generating QR code");
        }

        res.send({ qrCodeUrl, secret: secret.base32 });
    } catch (error) {
        console.error("Error in create2fa:", error);
        return res.status(500).send("Internal server error");
    }
};

const disable2fa = async (req, res) => {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    try {
        const { id } = payload;
        const twoFA = await db.TwoFA.findOne({ where: { userId: id } });
        if (!twoFA) {
            return res.status(404).send("2FA not enabled for this user");
        }
        await db.TwoFA.destroy({ where: { userId: id } });
        logger(req, "INFO", "disable2fa", payload.username, true, null, req.cookies?.token || null);
        res.status(200).send("2FA disabled successfully");
    } catch (error) {
        return res.status(500).send("Internal server error");
    }
};

const active2fa = async (req, res) => {

    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;

    const { code } = req.body;
    if (!code) {
        return res.status(400).send("code is required");
    }
    try {
        const _2fa = await db.TwoFA.findOne({ where: { userId: payload.id } });
        if (!_2fa) {
            return res.status(400).send("2FA not set up for this user");
        }
        console.log("Verifying code:", code, "with secret:", _2fa.secret);
        const verified = speakeasy.totp.verify({
            secret: _2fa.secret,
            encoding: "base32",
            token: code,
            window: 1,
        });

        if (!verified) {
            return res.status(400).send("Invalid code");
        }

        await db.TwoFA.update({ isActive: true }, { where: { userId: payload.id } });
        logger(req, "INFO", "create2fa", username, true, null, req.cookies?.token || null);
        return res.status(200).send("2FA activated successfully");
    } catch (error) {
        console.error("Error in active2fa:", error);
        return res.status(500).send("Internal server error");
    }
};

module.exports = {
    create2fa,
    disable2fa,
    active2fa
};
