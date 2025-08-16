const {
  login, getbyusername, getbyId, getUsers, register, updateUser, logout, online, getme
} = require("./Users");
const {
  addFriend, getFriends, actionsHandler, getPendingFriends, getRequestedFriends, getBlockedUsers
} = require("./Friends");

const {
  github, intra, google
} = require("./Oauth");

const {
  getMatch, create, getMatchs, finish, addscore
} = require("./Matche");

const check = require("./check");

const checkcode = require("./emailconfirm");
const _2fa = require("./2fa");
const {
  create: createNotification, getNotifications
} = require("./Notification");

async function UserRoutes(fastify) {
  fastify.post("/register", register);
  fastify.post("/login", login);
  fastify.post("/logout", logout);
  fastify.put("/update", updateUser);
  fastify.get("/:username", getbyusername);
  fastify.get("/id/:id", getbyId);
  fastify.get("/", getUsers);
  fastify.get("/get/me", getme);
  fastify.get("/online/:username", online.isOnline);
  fastify.put("/online", online.setOnline);
}

async function FriendRoutes(fastify) {
  fastify.post("/add", addFriend);
  fastify.post("/actions", actionsHandler);
  fastify.get("/my-friends", getFriends);
  fastify.get("/my-pending-friends", getPendingFriends);
  fastify.get("/my-requested-friends", getRequestedFriends);
  fastify.get("/my-blocked-users", getBlockedUsers);
}

async function OauthRoutes(fastify) {
  fastify.get("/github", github.redirect);
  fastify.get("/github/callback", github.handleAuthCallback);
  fastify.get("/intra", intra.redirect);
  fastify.get("/intra/callback", intra.handleAuthCallback);
  fastify.get("/google", google.redirect);
  fastify.get("/google/callback", google.handleAuthCallback);
}

async function checkCodeRoutes(fastify) {
  fastify.post("/sendcode", checkcode.send_code);
  fastify.post("/checkcode", checkcode.check_code);
}

async function _2faRoutes(fastify) {
  fastify.get("/disable", _2fa.disable2fa);
  fastify.get("/generate", _2fa.create2fa);
  fastify.post("/verify", _2fa.verify2fa);
}

async function checksRoutes(fastify) {
  fastify.get("/token", check);
}

async function MatcheRoutes(fastify) {
  fastify.post("/", create);
  fastify.get("/:id", getMatch);
  fastify.get('/user/:username', getMatchs);
  fastify.put("/finish", finish);
  fastify.put("/score-edit", addscore);
}

async function NotificationRoutes(fastify) {
  fastify.post("/create", createNotification);
  fastify.get("/user/:username", getNotifications);
}

module.exports = { UserRoutes, FriendRoutes, OauthRoutes, checkCodeRoutes, _2faRoutes, checksRoutes, MatcheRoutes, NotificationRoutes };
