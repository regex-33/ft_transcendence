const checkauthjwt = require("../../util/checkauthjwt");
const acceptFriendRequest = require("./accept");
const cancelFriendRequest = require("./cancel");
const unblockFriendRequest = require("./unblock");
const blockUser = require("./block");
const {fillObject} = require('../../util/logger');
const actionsHandler = async (req, reply) => {
  const { check, payload } = await checkauthjwt(req, reply);
  if (check) return check;
  req.user = payload;
  const { action, id } = req.body;
  const userId = req.user.id;
console.log(userId)
  if (!action || (!id)) {
    fillObject(req, "WARNING", "actionsHandler", userId, false, "action or id not provided", req.cookies?.token || null);
    return reply.status(400).send({ error: "Action and ID are required." });
  }

  if (typeof id !== "number" || isNaN(id)) {
    fillObject(req, "WARNING", "actionsHandler", userId, false, "Invalid ID format.", req.cookies?.token || null);
    return reply.status(400).send({ error: "Invalid ID format." });
  }
  switch (action) {
    case "accept":
      try {
        const result = await acceptFriendRequest(req,reply, userId, action, id);
        if (result) return result;
      } catch (error) {
        fillObject(req, "ERROR", "acceptFriendRequest", userId, false, error.message, req.cookies?.token || null);
        console.error("Error accepting friend request:", error);
        return reply
          .status(500)
          .send({ error: "An error occurred while processing the request." });
      }
      break;
    case "cancel":
      try {
        const result = await cancelFriendRequest(reply, userId, action, id);
        if (result) return result;
      } catch (error) {
        fillObject(req, "ERROR", "cancelFriendRequest", userId, false, error.message, req.cookies?.token || null);
        console.error("Error canceling friend request:", error);
        return reply
          .status(500)
          .send({ error: "An error occurred while processing the request." });
      }
      break;
    case "block":
      try {
        const result = await blockUser(reply, userId, action, id);
        if (result) return result;
      } catch (error) {
        fillObject(req, "ERROR", "blockUser", userId, false, error.message, req.cookies?.token || null);
        console.error("Error blocking user:", error);
        return reply
          .status(500)
          .send({ error: "An error occurred while processing the request." });
      }
      break;
    case "unblock":
      try {
        const result = await unblockFriendRequest(reply, userId, action, id);
        if (result) return result;
      } catch (error) {
        fillObject(req, "ERROR", "unblockFriendRequest", userId, false, error.message, req.cookies?.token || null);
        console.error("Error unblocking user:", error);
        return reply
          .status(500)
          .send({ error: "An error occurred while processing the request." });
      }
      break;
    default:
      return reply.status(400).send({ error: "Invalid action." });
  }
};

module.exports = actionsHandler;