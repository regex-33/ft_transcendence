const {
  login, getbyusername, getbyId, getUsers, register, updatePassword, update, logout, online, getme
} = require("./Users");
const {
  addFriend, getFriends, actionsHandler, getPendingFriends, getRequestedFriends, getBlockedUsers, rel
} = require("./Friends");
const {
  github, intra, google
} = require("./Oauth");
const check = require("./check");
// const checkcode = require("./emailconfirm");
const _2fa = require("./2fa");
const {
  create: createNotification, getNotifications, delete: deleteNotification
} = require("./Notification");

const { AuthRoutes } = require("./Auth");

function safeHandler(handler) {
  return async function wrappedHandler(req, reply) {
    try {
      return await handler(req, reply);
    } catch (err) {
      console.log(err);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  };
}

async function UserRoutes(fastify) {
  fastify.post("/register", safeHandler(register));
  fastify.post("/login", safeHandler(login));
  fastify.get("/logout", safeHandler(logout));
  fastify.put("/update", safeHandler(update));
  fastify.put("/update/password", safeHandler(updatePassword));
  fastify.get("/:username", safeHandler(getbyusername));// /api/users/aghlimi
  fastify.get("/id/:id", safeHandler(getbyId)); // /api/users/1
  fastify.get("/", safeHandler(getUsers));// /api/users/ => all
  fastify.get("/get/me", safeHandler(getme)); // /api/users/get/me => my info
  fastify.get("/online/:username", safeHandler(online.isOnline));
  fastify.put("/online", safeHandler(online.setOnline));
  fastify.get('/online-tracker', { websocket: true }, safeHandler(online.onlineTracker));
}

async function FriendRoutes(fastify) {
  fastify.post("/add", safeHandler(addFriend));
  fastify.post("/actions", safeHandler(actionsHandler));// /api/friends/actions {username, action:accept/cancel/block/unblock}
  fastify.get("/friends", safeHandler(getFriends));// /api/friends/friends => your friends
  fastify.get("/pending-friends", safeHandler(getPendingFriends));// /api/friends/pending-friends =>who request me
  fastify.get("/requested-friends", safeHandler(getRequestedFriends));// /api/friends/requested-friends => who i request  
  fastify.get("/blocked-users", safeHandler(getBlockedUsers));// /api/friends/blocked-users => who i block
  fastify.get('/rel/:id', safeHandler(rel)); // /api/friends/rel/2  get relation between me and user id=2
}

const { redirect: githubRedirect, handleAuthCallback: githubHandleAuthCallback } = github;
const { redirect: intraRedirect, handleAuthCallback: intraHandleAuthCallback } = intra;
const { redirect: googleRedirect, handleAuthCallback: googleHandleAuthCallback } = google;

async function OauthRoutes(fastify) {
  fastify.get("/github", safeHandler(githubRedirect));
  fastify.get("/github/callback", safeHandler(githubHandleAuthCallback));
  fastify.get("/intra", safeHandler(intraRedirect));
  fastify.get("/intra/callback", safeHandler(intraHandleAuthCallback));
  fastify.get("/google", safeHandler(googleRedirect));
  fastify.get("/google/callback", safeHandler(googleHandleAuthCallback));
}

// const { send_code, check_code } = checkcode;

// async function checkCodeRoutes(fastify) {
//   fastify.post("/sendcode", safeHandler(send_code));
//   fastify.post("/checkcode", safeHandler(check_code));
// }

const { disable2fa, create2fa, active2fa, check2faStatus } = _2fa;

async function _2faRoutes(fastify) {
  fastify.post("/disable", safeHandler(disable2fa)); // /api/2fa/disable
  fastify.get("/generate", safeHandler(create2fa)); // /api/2fa/generate
  fastify.post("/active2fa", safeHandler(active2fa)); // /api/2fa/active2fa
  fastify.get("/status", safeHandler(check2faStatus)); // /api/2fa/status
}

async function checksRoutes(fastify) {
  fastify.get("/token", safeHandler(check));
}

async function NotificationRoutes(fastify) {
  fastify.post("/create", safeHandler(createNotification));
  fastify.get("/", safeHandler(getNotifications));
  fastify.delete("/:gameId", safeHandler(deleteNotification));
}

module.exports = {
  UserRoutes,
  FriendRoutes,
  OauthRoutes,
  // checkCodeRoutes,
  _2faRoutes,
  checksRoutes,
  NotificationRoutes,
  AuthRoutes
};
