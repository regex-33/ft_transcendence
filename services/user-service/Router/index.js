const {
  login, getbyusername, getbyId, getUsers, register, updatePassword, update, logout, online, getme
} = require("./Users");
const {
  addFriend, getFriends, actionsHandler, getPendingFriends, getRequestedFriends, getBlockedUsers
} = require("./Friends");
const {
  github, intra, google
} = require("./Oauth");
const check = require("./check");
const checkcode = require("./emailconfirm");
const _2fa = require("./2fa");
const {
  create: createNotification, getNotifications
} = require("./Notification");

const { AuthRoutes } = require("./Auth");

async function UserRoutes(fastify) {
  fastify.post("/register", register);
  fastify.post("/login", login);
  fastify.get("/logout", logout);
  fastify.put("/update", update);
  fastify.put("/update/password", updatePassword);
  fastify.get("/:username", getbyusername);// /api/users/aghlimi
  fastify.get("/id/:id", getbyId); // /api/users/1
  fastify.get("/", getUsers);// /api/users/ => all
  fastify.get("/get/me", getme); // /api/users/get/me => my info
  fastify.get("/online/:username", online.isOnline);
  fastify.put("/online", online.setOnline);
  fastify.get('/online-tracker',{websocket:true},online.onlineTracker)
}

async function FriendRoutes(fastify) {
  fastify.post("/add", addFriend);
  fastify.post("/actions", actionsHandler);// /api/friends/actions {username, action:accept/cancel/block/unblock}
  fastify.get("/friends", getFriends);// /api/friends/friends => your friends
  fastify.get("/pending-friends", getPendingFriends);// /api/friends/pending-friends =>who request me
  fastify.get("/requested-friends", getRequestedFriends);// /api/friends/requested-friends => who i request  
  fastify.get("/blocked-users", getBlockedUsers);// /api/friends/blocked-users => who i block
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
  fastify.get("/status", _2fa.check2faStatus);
}

async function checksRoutes(fastify) {
  fastify.get("/token", check);
}

async function NotificationRoutes(fastify) {
  fastify.post("/create", createNotification);
  fastify.get("/", getNotifications);
}

module.exports = { 
  UserRoutes, 
  FriendRoutes, 
  OauthRoutes, 
  checkCodeRoutes, 
  _2faRoutes, 
  checksRoutes, 
  NotificationRoutes,
  AuthRoutes
};
