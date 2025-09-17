const { base64urlEncode, base64urlDecode } = require("./base64");
const crypto = require("crypto");
const { JWT_SECRET, TIME_TOKEN_EXPIRATION } = process.env;
const db = require('../models');
const { NUMBER } = require("sequelize");


const sign = (payload, secret, options = {}) => {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };
    const { expiresIn } = options;
    if (expiresIn)
        header.exp = Math.floor(Date.now() / 1000) + Number(expiresIn);

    const headerEncoded = base64urlEncode(JSON.stringify(header));
    const payloadEncoded = base64urlEncode(JSON.stringify(payload));

    const data = `${headerEncoded}.${payloadEncoded}`;
    const signature = crypto
        .createHmac("sha256", secret)
        .update(data)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    return `${data}.${signature}`;
};

const verify = async (token, secret, callback) => {
    if (!token) {
        return await callback("invalid token", null);
    }
    const [headerEncoded, payloadEncoded, signature] = token.split(".");
    const data = `${headerEncoded}.${payloadEncoded}`;
    let new_token;
    const expectedSignature = crypto
        .createHmac("sha256", secret || process.env.JWT_SECRET || "my_secret")
        .update(data)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const payload = JSON.parse(base64urlDecode(payloadEncoded));
    if (signature !== expectedSignature) {
        return await callback("invalid token", null);
    }

    const header = JSON.parse(base64urlDecode(headerEncoded));
    const { id } = payload;

    const user = await db.User.findOne({ where: { id } });

    if (!user) {
        return await callback("user not found", payload);
    }

    if (user.valid === false) {
        return await callback("token expired", payload);
    }
    if (header.exp && Number(header.exp) < Math.floor(Date.now() / 1000)) {
        console.log(`======================token expired for ${id}======================`);
        new_token = sign(payload, JWT_SECRET, { expiresIn: TIME_TOKEN_EXPIRATION });
    }
    return await callback(null, { payload, new_token });
}

module.exports = {
    sign,
    verify
};