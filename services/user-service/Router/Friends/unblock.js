const { User, Relationship } = require("../../models");
const { fillObject } = require("../../util/logger");

const unblockFriendRequest = async (reply, ...inputs) => {
  const [userId, action, id] = inputs;
  const rel = await Relationship.findOne({
    where: {
      to: id,
      creator: userId, 
      status: "blocked",
    },
  });

  if (!rel) {
    fillObject(req, "WARNING", "unblockFriendRequest", userId, false, "relationship not found", req.cookies?.token || null);
    return reply.status(404).send({ error: "Relationship not found." });
  }

  if (rel.from !== userId && rel.to !== userId) {
    fillObject(req, "WARNING", "unblockFriendRequest", userId, false, "not authorized to unblock this request", req.cookies?.token || null);
    return reply
      .status(403)
      .send({ error: "You are not authorized to unblock this request." });
  }

  await rel.destroy();
  fillObject(req, "INFO", "unblockFriendRequest", userId, true, "", req.cookies?.token || null);
  return reply.status(204).send();
};

module.exports = unblockFriendRequest;
