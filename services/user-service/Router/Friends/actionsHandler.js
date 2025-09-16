const checkAuthJWT = require("../../util/checkauthjwt");
const acceptFriendRequest = require("./accept");
const cancelFriendRequest = require("./cancel");
const unblockAction = require("./unblock");
const blockUser = require("./block");
const actionsHandler = async (req, reply) => {
  try {
    const { check, payload } = await checkAuthJWT(req, reply);
    if (check) return;
    const { username, action } = req.body;
    const userId = payload.id;

    if (!action || (!username)) {
      return reply.status(400).send({ error: "Action and username are required." });
    }

    if (typeof username !== "string") {
      return reply.status(400).send({ error: "Invalid username format." });
    }
    switch (action) {
      case "accept":
        try {
          if (await acceptFriendRequest(req, reply, payload, userId, username)) return;
        } catch (error) {
          console.log("Error accepting friend request:", error);
          return reply
            .status(500)
            .send({ error: "An error occurred while processing the request." });
        }
        break;
      case "cancel":
        try {
          const result = await cancelFriendRequest(req, reply, payload, username);
          if (result) return result;
        } catch (error) {
          console.log("Error canceling friend request:", error);
          return reply
            .status(500)
            .send({ error: "An error occurred while processing the request." });
        }
        break;
      case "block":
        try {
          const result = await blockUser(req, reply, payload, userId, username);
          if (result) return result;
        } catch (error) {
          console.log("Error blocking user:", error);
          return reply
            .status(500)
            .send({ error: "An error occurred while processing the request." });
        }
        break;
      case "unblock":
        try {
          const result = await unblockAction(req, reply, payload, userId, username);
          if (result) return result;
        } catch (error) {
          console.log("Error unblocking user:", error);
          return reply
            .status(500)
            .send({ error: "An error occurred while processing the request." });
        }
        break;
      default:
        return reply.status(400).send({ error: "Invalid action." });
    }
  } catch (error) {
    console.log("Error processing friend action:", error);
    return reply
      .status(500)
      .send({ error: "An error occurred while processing the request." });
  }
};

module.exports = actionsHandler;
