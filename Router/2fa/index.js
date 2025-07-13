const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const db = require("../../models");

const { JWT_SECRET, TIME_TOKEN_EXPIRATION } = process.env;
const jwt = require("../../middleware/jwt");

const create2fa = async (req, res) => {
    const { username } = req.params;
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
    res.type("html").send(`
                        <!DOCTYPE html>
                        <html lang="en">
                            <head>
                            <meta charset="UTF-8" />
                            <title>2FA QR Code</title>
                            <style>
                                body {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                                background: #f0f0f0;
                                margin: 0;
                                font-family: sans-serif;
                                }
                                img {
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
                                }
                            </style>
                            </head>
                            <body>
                            <img src="${qrCodeUrl}" alt="QR Code" />
                            </body>
                        </html>
                        `);
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
        res.send({ token });
    } else {
        return res.status(401).send("Invalid token");
    }
};

module.exports = {
    create2fa,
    verify2fa,
};