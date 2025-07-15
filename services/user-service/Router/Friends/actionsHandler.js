const checkauthjwt = require("../../middleware/checkauthjwt");
const acceptFriendRequest = require("./accept");
const cancelFriendRequest = require("./cancel");
const unblockFriendRequest = require("./unblock");
const blockUser = require("./block");
// accept
// reject
// block
// unblock
const actionsHandler = async (req, reply) => {
  let check = checkauthjwt(req, reply);
  // return reply.status(501).send({ error: "This endpoint is not implemented yet." });
  const { action, id } = req.body;
  const userId = req.user.id;

  if (!action || (!id)) {
    return reply.status(400).send({ error: "Action and ID are required." });
  }

  if (typeof id !== "number" || isNaN(id)) {
    return reply.status(400).send({ error: "Invalid ID format." });
  }
  switch (action) {
    case "accept":
      try {
        const result = await acceptFriendRequest(reply, userId, action, id);
        if (result) return result;
      } catch (error) {
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