const db = require("../../models");
const checkAuthJWT = require("../../middleware/checkauthjwt");
const { User, Relationship } = db;

const blockUser = async (reply, userId, action, id) => {
  let users;
  try {
    users = await User.findAll({
      where: {
        id: [id, userId],
      },
    });
    if (users.length !== 2) {
      return reply.status(404).send({
        error: "User not found.",
      });
    }
    const rel = await Relationship.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { from: id, to: userId },
          { from: userId, to: id },
        ],
      },
    });
    if (!rel) {
      const block = await Relationship.create({
        from: userId,
        to: id,
        creator: userId,
        status: "blocked",
      });
      if (!block) {
        return reply.status(500).send({
          error: "An error occurred while blocking the user.",
        });
      }
      return reply.status(202).send({ blocked: true });
    } else {
      if (rel.status === "friend") {
        await Promise.all(users.map((user) => user.update({ friends: user.friends - 1 })));
      }
      rel.creator = userId;
      if (rel.status === "blocked") {
        return reply.status(400).send({
          error: "User is already blocked.",
        });
      }
      await rel.update({ status: "blocked" });
      return reply.status(202).send({ blocked: true });
    }
  } catch (error) {
    console.error("Error blocking user:", error);
    return reply.status(500).send({
      error: "An error occurred while blocking the user.",
    });
  }
};

module.exports = blockUser;