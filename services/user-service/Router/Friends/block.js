const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");

const blockUser = async (req, reply, payload, userId, username) => {
  try {
    const user = await db.User.findOne({ where: { username } });
    if (!user) {
      return reply.status(404).send({ error: "User not found." });
    }
    if (user.id === payload.id) {
      return reply.status(400).send({ error: "You cannot block yourself." });
    }
    console.log('block user:', userId, 'by:', payload.id);
    const rel = await db.Relationship.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { userId: user.id, otherId: payload.id },
          { otherId: user.id, userId: payload.id }
        ]
      }
    });
    if (!rel || rel.status == 'blocked') {
      return reply.status(404).send({ 'message': 'this user not friend.' });
    }
    rel.status = 'blocked';
    await rel.save();
    return reply.send({ 'message': 'success' });

  } catch (error) {
    console.log('block crash:', error);
    return reply.status(500).send({ error: 'internal server error' });
  }
};

module.exports = blockUser;