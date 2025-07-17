const request = require("undici").request;
const db = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("../../util/jwt");
const {
    JWT_SECRET,
    TIME_TOKEN_EXPIRATION,
    INTRA_CLIENT_ID,
    INTRA_CLIENT_SECRET
} = process.env;
const redirect = (req, reply) => {
    const redirectURL = `https://api.intra.42.fr/oauth/authorize?client_id=${INTRA_CLIENT_ID}&response_type=code&redirect_uri=http://localhost:3000/api/auth/intra/callback`;
    reply.redirect(redirectURL);
};

const handleAuthCallback = async (req, reply) => {
    const { code } = req.query;
    if (!code) {
        return reply.code(400).send({ error: "Missing code" });
    }

    const tokenRes = await request(
        "https://api.intra.42.fr/oauth/token",
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                grant_type: "authorization_code",
                client_id: INTRA_CLIENT_ID,
                client_secret: INTRA_CLIENT_SECRET,
                code,
                redirect_uri: "http://localhost:3000/api/auth/intra/callback",
            }),
        }
    );
    const tokenData = await tokenRes.body.json();

    const token = tokenData?.access_token;
    if (!token) {
        return reply.code(401).send({ error: "Invalid token" });
    }

    const userRes = await request("https://api.intra.42.fr/v2/me", {
        headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "ft_transcendence",
        },
    });
    const userData = await userRes.body.json();
    const {
        id, email, login, image: { link: url } = {},
    } = userData;
    const user = await db.User.findOne({ where: { [db.Sequelize.Op.or]: [{ username: login }, { email: email }] } });
    if (user && user.identifier !== `intra-${id}`) {
        return reply
            .code(400)
            .send({ error: "Username already exists" });
    }

    try {
        const [user, created] = await db.User.findOrCreate({
            where: { identifier: `intra-${id}` },
            defaults: {
                username: login,
                identifier: `intra-${id}`,
                image: url,
                email: email || `${login}@intra.42.fr`,
                password: await bcrypt.hash(
                    "96dd02f019520463b(-_*)64fa7ef1170d1cf033404b4",
                    10
                ),
            },
        });

        if (created) {
            console.log(`User ${login} created successfully.`);
        } else {
            console.log(`User ${login} already exists.`);
        }
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: TIME_TOKEN_EXPIRATION }
        );
        if (!token) {
            return reply.code(500).send({ error: "Failed to generate token" });
        }
        return Cookies(reply, token).status(201 && created || 200).redirect(process.env.HOME);

    } catch (err) {
        console.error("Error creating or finding user:", err);
    }
};

module.exports = {
    redirect,
    handleAuthCallback
};