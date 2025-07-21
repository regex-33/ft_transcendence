const { base64urlEncode, base64urlDecode } = require("./base64");
const crypto = require("crypto");
const { JWT_SECRET } = process.env;

const sign = (payload, secret, options = {}) => {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };
    const { expiresIn } = options;
    if (expiresIn)
        header.exp = Math.floor(Date.now() / 1000) + expiresIn;

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
    const [headerEncoded, payloadEncoded, signature] = token.split(".");
    const data = `${headerEncoded}.${payloadEncoded}`;
    let token;
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(data)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    if (signature !== expectedSignature) {
        await callback("invalid token", payload);
        return;
    }

    const payload = JSON.parse(base64urlDecode(payloadEncoded));
    const header = JSON.parse(base64urlDecode(headerEncoded));
    const { username } = payload;

    const user = await global.db.User.findOne({ where: { username } });

    if (!user) {
        await callback("user not found", payload);
        return;
    }

    if (user.valid === false) {
        await callback("token expired", payload);
        return;
    }

    if (header.exp && header.exp < Math.floor(Date.now() / 1000)) {
        token = sign(payload, JWT_SECRET, { expiresIn: TIME_TOKEN_EXPIRATION });
    }

    await callback(null, { payload, token });
    return { payload, token };
}

module.exports = {
    sign,
    verify
};