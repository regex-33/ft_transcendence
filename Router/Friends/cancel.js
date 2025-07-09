const { User, Relationship } = require("../../models");

const cancelFriendRequest = async (reply, ...inputs) => {
  const [userId, action, id] = inputs;
  const rel = await Relationship.findOne({
    where: {
      id: id,
    },
  });

  if (!rel) {
    return reply.status(404).send({ error: "Relationship not found." });
  }

  if (rel.from !== userId && rel.to !== userId) {
    return reply
      .status(403)
      .send({ error: "You are not authorized to cancel this request." });
  }
  
  if (rel.status == "friend" || rel.status == "pending") {
    try {
      const users = await User.findAll({
        where: {
          id: [rel.from, rel.to],
        },
      });
      for (const user of users) {
        await user.update({ friends: user.friends - 1 });
      }
      await rel.destroy();
      return reply.status(204).send();
    } catch (error) {
      return reply.status(500).send({
        error: "An error occurred while updating user friends count.",
        details: error.message,
      });
    }
  }
};

module.exports = cancelFriendRequest;
