const { User, Relationship } = require("../../models");

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
    return reply.status(404).send({ error: "Relationship not found." });
  }

  if (rel.from !== userId && rel.to !== userId) {
    return reply
      .status(403)
      .send({ error: "You are not authorized to unblock this request." });
  }

  await rel.destroy();
  return reply.status(204).send();
};

module.exports = unblockFriendRequest;
