const { User, Relationship } = require("../../models");
const { fillObject } = require("../../util/logger");
const acceptFriendRequest = async (reply, ...inputs) => {
  const [userId, action, id] = inputs;
  const rel = await Relationship.findOne({
    where: {
      from: id,
      to: userId,
    },
  });
  if (!rel) {
    fillObject(req, "WARNING", "acceptFriendRequest", userId, false, "relationship not found", req.cookies?.token || null);
    return reply.status(404).send({ error: "Relationship not found." });
  }

  if (rel.status !== "pending") {
    fillObject(req, "WARNING", "acceptFriendRequest", userId, false, "friend request is not pending", req.cookies?.token || null);
    return reply.status(400).send({ error: "Friend request is not pending." });
  }

  await rel.update({ status: "friend" });
  const users = await User.findAll({
    where: {
      id: [rel.to, rel.from],
    },
  });
  if (users.length !== 2) {
    fillObject(req, "WARNING", "acceptFriendRequest", userId, false, "users not found", req.cookies?.token || null);
    return reply.status(404).send({ error: "Users not found." });
  }
  await Promise.all(
    users.map((user) => {
      console.log("Updating friends count for user:", user.friends);
      return user.update({ friends: user.friends + 1 });
    })
  );
  fillObject(req, "INFO", "acceptFriendRequest", userId, true, "", req.cookies?.token || null);
  return reply.status(200).send(rel);
};

module.exports = acceptFriendRequest;