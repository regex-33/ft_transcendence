const { base64urlEncode, base64urlDecode } = require("./base64");
const crypto = require("crypto");

const sign = (payload, secret) => {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };

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
    await callback(null, payload);
    return payload;
}

module.exports = {
    sign,
    verify
};