const { base64urlDecode } = require("./base64");
const crypto = require("crypto");

const verify = async (token, secret, callback) => {
    try {
        if (!token) {
            return await callback("invalid token", null);
        }
        const [headerEncoded, payloadEncoded, signature] = token.split(".");
        const data = `${headerEncoded}.${payloadEncoded}`;
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
        return await callback(null, payload);
    } catch (err) {
        return await callback(err.message, null);
    }
}

module.exports = {
    verify
};