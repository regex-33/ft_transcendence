const db = require("../../models");
const { request } = require("undici");
const bcrypt = require("bcrypt");
const jwt = require("../../util/jwt");
const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
const { JWT_SECRET, TIME_TOKEN_EXPIRATION } = process.env;
const Cookies = require("../../util/cookie");
const { logger } = require("../../util/logger");

const redirect = async (req, reply) => {
  const redirectURL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}`;
  reply.redirect(redirectURL);
};


const handleAuthCallback = async (req, reply) => {
  const { code } = req.query;

  if (!code) {
    return reply.status(400).send({ error: "Missing code" });
  }

  const tokenRes = await request(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );

  const tokenData = await tokenRes.body.json();

  if (!tokenData.access_token) {
    return reply.status(401).send({ error: "Invalid GitHub code" });
  }

  const userRes = await request("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "ft_transcendence",
    },
  });

  const userData = await userRes.body.json();
  const {
    login: username,
    avatar_url: avatarUrl,
    email,
    id,
  } = userData;

  try {
    const user = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ username }, { email }]
      }
    });
    if (user && user.identifier !== `github-${id}`) {
      return reply
        .status(400)
        .send({ error: "Username or email already exists" });
    }
  } catch (err) {
    console.error("Error checking user:", err);
    return reply.status(500).send({ error: "Internal server error" });
  }
  try {
    const [user, created] = await db.User.findOrCreate({
      where: { identifier: `github-${id}` },
      defaults: {
        username,
        identifier: `github-${id}`,
        avatar: avatarUrl,
        email: email || `${username}@github.com`,
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
      logger(req, "ERROR", "githubOauth", login, true, "tokenGenerationFailed", req.cookies?.token || null);
      return reply.status(500).send({ error: "Failed to generate token" });
    }
    if (created) {
      logger(req, "INFO", "register", login, true, "GithubOAuth", req.cookies?.token || null);
    } else {
      logger(req, "INFO", "login", login, true, "GithubOAuth", req.cookies?.token || null);
    }
    return Cookies(reply, token, user.id).redirect(process.env.HOME_PAGE);

  } catch (err) {
    console.error("Error creating or finding user:", err);
    return reply.status(500).send({ error: "Internal server error" });
  }
};
module.exports = {
  handleAuthCallback,
  redirect
};
