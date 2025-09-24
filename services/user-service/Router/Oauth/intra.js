const request = require("undici").request;
const db = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("../../util/jwt");
const { logger } = require("../../util/logger");
const Cookies = require("../../util/cookie");
const {
    JWT_SECRET,
    TIME_TOKEN_EXPIRATION,
    INTRA_CLIENT_ID,
    INTRA_CLIENT_SECRET,
    INTRA_CALLBACK_URL
} = process.env;
const redirect = (req, reply) => {
    const redirectURL = `https://api.intra.42.fr/oauth/authorize?client_id=${INTRA_CLIENT_ID}&redirect_uri=${INTRA_CALLBACK_URL}&response_type=code`;
    reply.redirect(redirectURL);
};

const handleAuthCallback = async (req, reply) => {
    const { code } = req.query;
    if (!code) {
        return reply.status(400).send({ error: "Missing code" });
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
                redirect_uri: INTRA_CALLBACK_URL,
            }),
        }
    );
    const tokenData = await tokenRes.body.json();

    const token = tokenData?.access_token;
    if (!token) {
        return reply.status(401).send({ error: "Invalid token" });
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
            .status(400)
            .send({ error: "Username or email already exists" });
    }

    try {
        const [user, created] = await db.User.findOrCreate({
            where: { identifier: `intra-${id}` },
            defaults: {
                username: login,
                identifier: `intra-${id}`,
                avatar: url,
                email: email || `${login}@intra.42.fr`,
                password: await bcrypt.hash(
                    "96dd02f019520463b(-_*)64fa7ef1170d1cf033404b4",
                    10
                ),
            },
        });
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: TIME_TOKEN_EXPIRATION }
        );
        if (!token) {
            logger(req, "ERROR", "IntraOAuth", login, true, "tokenGenerationFailed", req.cookies?.token || null);
            return reply.status(500).send({ error: "Failed to generate token" });
        }
        if (created) {
            logger(req, "INFO", "register", login, true, "IntraOAuth", req.cookies?.token || null);
        } else {
            logger(req, "INFO", "login", login, true, "IntraOAuth", req.cookies?.token || null);
        }
        return Cookies(reply, token, user.id).redirect(process.env.HOME_PAGE);

    } catch (err) {
        require(`${process.env.PROJECT_PATH}/util/catch`)(err);
        return reply.status(500).send({ error: "Internal Server Error" });
    }
};

module.exports = {
    redirect,
    handleAuthCallback
};