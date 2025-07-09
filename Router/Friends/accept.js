const { User, Relationship } = require("../../models");

const acceptFriendRequest = async (reply, ...inputs) => {
  const [userId, action, id] = inputs;
  const rel = await Relationship.findOne({
    where: {
      id: id,
      to: userId,
    },
  });
  if (!rel) {
    return reply.status(404).send({ error: "Relationship not found." });
  }

  if (rel.status !== "pending") {
    return reply.status(400).send({ error: "Friend request is not pending." });
  }

  await rel.update({ status: "friend" });
  return reply.status(200).send(rel);
};

module.exports = acceptFriendRequest;