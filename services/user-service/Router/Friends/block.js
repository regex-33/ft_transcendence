const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");

const blockUser = async (req, reply, payload, userId, username) => {
  try {
    const rel = await db.Relationship.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { userId: userId },
          { otherId: userId }
        ]
      }
    });
    if (!rel) {
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