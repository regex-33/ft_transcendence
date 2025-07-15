const request = require("undici").request;
const db = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("../../middleware/jwt");

const {
    JWT_SECRET,
    TIME_TOKEN_EXPIRATION,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
} = process.env;

const redirect = (req, reply) => {
    const redirectURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:3000/api/auth/google/callback&response_type=code&scope=openid%20email%20profile`;
    reply.redirect(redirectURL);
};


const handleAuthCallback = async (req, reply) => {
    try {

        const { code } = req.query;
        if (!code) {
            return reply.code(400).send({ error: "Missing code" });
        }

        const tokenRes = await request(
            "https://oauth2.googleapis.com/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    code,
                    redirect_uri: "http://localhost:3000/api/auth/google/callback",
                }).toString(),
            }
        );
        const tokenData = await tokenRes.body.json();

        const token = tokenData?.access_token;
        if (!token) {
            return reply.code(401).send({ error: "Invalid token" });
        }

        const userRes = await request("https://www.googleapis.com/oauth2/v1/userinfo", {
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent": "ft_transcendence",
            },
        });
        const userData = await userRes.body.json();
        const { id, email, name, picture: url } = userData;
        const username = email.split("@")[0];

        let user = await db.User.findOne({ where: { [db.Sequelize.Op.or]: [{ username }, { email }] } });
        if (user && user.identifier !== `google-${id}`) {
            return reply
                .code(400)
                .send({ error: "Username already exists" });
        }

        if (!user) {
            const hashedPassword = await bcrypt.hash("96dd02f019520463b(-_*)64fa7ef1170d1cf033404b4", 10);
            user = await db.User.create({
                username,
                email,
                name,
                password: hashedPassword,
                identifier: `google-${id}`,
                firstName: name.split(" ")[0],
                lastName: name.split(" ")[1] || "",
                url,
            });
            if (!user) {
                return reply.code(500).send({ error: "Failed to create user" });
            }
        }

        const jwtToken = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: TIME_TOKEN_EXPIRATION });
        reply.send({ token: jwtToken });
    } catch (error) {
        console.error("Error during Google OAuth callback:", error);
        reply.code(500).send({ error: "Internal Server Error" });
    }
}

module.exports = {
    redirect,
    handleAuthCallback,
};
