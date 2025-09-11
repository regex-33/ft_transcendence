const { User, Relationship } = require("../../models");
const { fillObject } = require("../../util/logger");
const acceptFriendRequest = async (req, reply,payload, ...inputs) => {
  const [userId, username] = inputs;

  try {
    const friend = await User.findOne({ where: { username } });
    if (!friend) {
      fillObject(
        req,
        "WARNING",
        "acceptFriendRequest",
        payload.username,
        false,
        "user not found",
        req.cookies?.token || null
      );
      return reply.status(404).send({ error: "user not found" });
    }
    if (userId === friend.id) {
      fillObject(
        req,
        "WARNING",
        "acceptFriendRequest",
        userId,
        false,
        "can't accept request from yourself",
        req.cookies?.token || null
      );
      console.log(friend.id, userId);
      return reply
        .status(400)
        .send({ error: "You can't accept a friend request from yourself." });
    }
    
    const rel = await Relationship.findOne({
      where: {
        userId: friend.id,
        otherId: userId
      }
    });
    if (!rel) {
      fillObject(
        req,
        "WARNING",
        "acceptFriendRequest",
        userId,
        false,
        "no relationship pended",
        req.cookies?.token || null
      );
      return reply.status(404).send({ error: "No relationship pended." });
    }

    rel.status = 'friend';
    await rel.save();
    return reply.status(200).send({ message: "Friend request accepted." });
  } catch (error) {
    fillObject(
      req,
      "ERROR",
      "acceptFriendRequest",
      userId,
      false,
      error.message,
      req.cookies?.token || null
    );
    console.log("Error accepting friend request:", error);
    return reply
      .status(500)
      .send({ error: "internal server error" });
  }
};

module.exports = acceptFriendRequest;
