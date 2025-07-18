const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
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
      fillObject(req, "WARNING", "blockUser", userId, false, "users not found", req.cookies?.token || null);
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
        fillObject(req, "ERROR", "blockUser", userId, false, "Error creating block relationship", req.cookies?.token || null);
        return reply.status(500).send({
          error: "An error occurred while blocking the user.",
        });
      }
      fillObject(req, "INFO", "blockUser", userId, true, "", req.cookies?.token || null);
      return reply.status(202).send({ blocked: true });
    } else {
      if (rel.status === "friend") {
        await Promise.all(users.map((user) => user.update({ friends: user.friends - 1 })));
      }
      rel.creator = userId;
      if (rel.status === "blocked") {
        fillObject(req, "WARNING", "blockUser", userId, false, "user is already blocked", req.cookies?.token || null);
        return reply.status(400).send({
          error: "User is already blocked.",
        });
      }
      await rel.update({ status: "blocked" });
      fillObject(req, "INFO", "blockUser", userId, true, "", req.cookies?.token || null);
      return reply.status(202).send({ blocked: true });
    }
  } catch (error) {
    console.error("Error blocking user:", error);
    fillObject(req, "ERROR", "blockUser", userId, false, error.message, req.cookies?.token || null);
    return reply.status(500).send({
      error: "An error occurred while blocking the user.",
    });
  }
};

module.exports = blockUser;