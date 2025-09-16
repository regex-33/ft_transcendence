const db = require("../../models");
const { logger } = require("../../util/logger");

const blockUser = async (req, reply, payload, userId, username) => {
  try {
    const user = await db.User.findOne({ where: { username } });
    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }
    if (user.id === payload.id) {
      return reply.status(400).send({ error: "You cannot block yourself." });
    }
    await db.Relationship.destroy({
      where: {
        [db.Sequelize.Op.or]: [
          { userId: user.id, otherId: payload.id },
          { otherId: user.id, userId: payload.id }
        ]
      }
    });
    try {
      const rel = await db.Relationship.create({
        userId: payload.id,
        otherId: user.id,
        status: 'blocked'
      });
      rel.status = 'blocked';
      await rel.save();
    } catch (error) {
      console.log('block create error:', error.message);
      return reply.status(500).send({ error: 'internal server error' });
    }
      logger(req, "INFO", "blockUser", payload.username, true, `${username}_blocked`, req.cookies?.token || null);
    return reply.send({ 'message': 'success' });

  } catch (error) {
    console.log('block crash:', error);
    return reply.status(500).send({ error: 'internal server error' });
  }
};

module.exports = blockUser;