const { User, Relationship } = require("../../models");
const { logger } = require("../../util/logger");
const acceptFriendRequest = async (req, reply,payload, ...inputs) => {
  const [userId, username] = inputs;


  try {
    const friend = await User.findOne({ where: { username } });
    if (!friend) {
      return reply.status(404).send({ error: "user not found" });
    }
    if (userId === friend.id) {

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
      return reply.status(404).send({ error: "No relationship pended." });
    }

    rel.status = 'friend';
    await rel.save();
    logger(req, "INFO", "acceptFriendRequest", userId, true, null, req.cookies?.token || null);
    return reply.status(200).send({ message: "Friend request accepted." });
  } catch (error) {
    return reply
      .status(500)
      .send({ error: "internal server error" });
  }
};

module.exports = acceptFriendRequest;
