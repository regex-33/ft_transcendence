
const nodemailer = require('nodemailer');
const db = require("../../models");
const { User , ResetCode } = db;
const jwt = require("../../util/jwt");
const { JWT_SECRET, TIME_TOKEN_EXPIRATION } = process.env;
const Cookie = require("../../util/cookie");
const { fillObject } = require('../../util/logger');
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_APP_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});


const randomCGCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const send_code = async (req, reply) => {
    const { email } = req.body;
    if (!email) {
        fillObject(req,"WARNING", "send_code", "unknown",false,"email not provided",req.cookies?.token || null);
        return reply.code(400).send({ error: "Email is required" });
    }
    try {
        const code = randomCGCode();
        const user = await User.findOne({ where: { email } });
        if (!user) {
            fillObject(req,"WARNING", "send_code", "unknown",false,"user not found",req.cookies?.token || null);
            return reply.code(404).send({ error: "User not found" });
        }

        const existingCode = await ResetCode.findOne({ where: { email } });

        if (existingCode) {
            existingCode.update({ code });
            await existingCode.save();
        } else {
            await ResetCode.create({ email, code });
        }

        await transporter.sendMail({
            from: process.env.GMAIL_APP_EMAIL,
            to: email,
            subject: 'Your Code to reset password',
            html: `<p>Your code is: <strong>${code}</strong></p>`,
        });
        fillObject(req,"INFO", "send_code", user.username,true,"",req.cookies?.token || null);
        return Cookie(reply, token).status(200).send({});
    } catch (err) {
        console.error("Mail Error:", err);
        fillObject(req,"ERROR", "send_code", "unknown",false,err.message,req.cookies?.token || null);
        return reply.code(500).send("Email sending failed");
    }
};

const check_code = async (req, reply) => {
    const { email, code } = req.body;
    if (!email || !code) {
        fillObject(req,"WARNING", "check_code", "unknown",false,"email or code not provided",req.cookies?.token || null);
        return reply.code(400).send({ error: "Email and code are required" });
    }
    try {
        const resetCode = await ResetCode.findOne({ where: { email, code } });
        if (!resetCode) {
            fillObject(req,"WARNING", "check_code", "unknown",false,"invalid code",req.cookies?.token || null);
            return reply.code(400).send({ error: "Invalid code" });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            fillObject(req,"WARNING", "check_code", "unknown",false,"user not found",req.cookies?.token || null);
            return reply.code(404).send({ error: "User not found" });
        }
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: TIME_TOKEN_EXPIRATION }
        );
        if (!token) {
            fillObject(req,"ERROR", "check_code", "unknown",false,"Failed to generate token",req.cookies?.token || null);
            return reply.code(500).send({ error: "Failed to generate token" });
        }
        await ResetCode.destroy({ where: { email } });
        fillObject(req,"INFO", "check_code", user.username,true,"",req.cookies?.token || null);
        return Cookie(reply, token).redirect(process.env.HOME_PAGE);
    }
    catch (err) {
        console.error("Error checking code:", err);
        fillObject(req,"ERROR", "check_code", "unknown",false,err.message,req.cookies?.token || null);
        return reply.code(500).send({ error: "Internal server error" });
    }
};

module.exports = {
    send_code,
    check_code
};