const { User, Relationship } = require("../../models");
const { Op } = require("sequelize");
const { fillObject } = require("../../util/logger");
const cancelFriendRequest = async (reply, ...inputs) => {
  const [userId, action, id] = inputs;
  const rel = await Relationship.findOne({
    where: {
      [Op.or]: [
        { from: userId, to: id },
        { from: id, to: userId },
      ],
    },
  });

  if (!rel) {
    fillObject(req, "WARNING", "cancelFriendRequest", userId, false, "relationship not found", req.cookies?.token || null);
    return reply.status(404).send({ error: "Relationship not found." });
  }

  if (rel.from !== userId && rel.to !== userId) {
    fillObject(req, "WARNING", "cancelFriendRequest", userId, false, "not authorized to cancel this request", req.cookies?.token || null);
    return reply
      .status(403)
      .send({ error: "You are not authorized to cancel this request." });
  }

  if (!rel) {
    fillObject(req, "WARNING", "cancelFriendRequest", userId, false, "relationship not found", req.cookies?.token || null);
    return reply.status(404).send({ error: "Relationship not found." });
  }

  if (rel.from !== userId && rel.to !== userId) {
    fillObject(req, "WARNING", "cancelFriendRequest", userId, false, "not authorized to cancel this request", req.cookies?.token || null);
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
        if (rel.status === "friend") {
          await user.update({ friends: user.friends - 1 });
        }
      }
      await rel.destroy();
      fillObject(req, "INFO", "cancelFriendRequest", userId, true, "", req.cookies?.token || null);
      return reply.status(204).send();
    } catch (error) {
      fillObject(req, "ERROR", "cancelFriendRequest", userId, false, error.message, req.cookies?.token || null);
      console.error("Error updating user friends count:", error);
      return reply.status(500).send({
        error: "An error occurred while updating user friends count."
      });
    }
  }
};

module.exports = cancelFriendRequest;
