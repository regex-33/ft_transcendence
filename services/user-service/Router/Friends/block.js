const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");

const blockUser = async (req, reply, payload, userId, username) => {
  try {
    const users = await Promise.all([
      db.User.findOne({ where: { username } }),
      db.User.findByPk(userId)
    ]);
    if (users.filter(user => user).length != 2) {
      fillObject(req, 'WARNING', 'block', payload.username, false, 'user not found', req.cookies?.token || null);
      return reply.stats(404).send({ 'message': 'user not found' });
    }
    await users[1].addOther(users[0], { through: { status: 'blocked' } });
    fillObject(req, 'INFO', 'block', payload.username, true, null, req.cookies?.token || null);
    return reply.send({ 'message': 'success' });
  } catch (error) {
    fillObject(req, 'ERROR', 'block', payload.username, false, error.message, req.cookies?.token || null);
    console.log('block crash:', error);
    return reply.stats(500).send({ error: 'internal server error' })
  }
};

module.exports = blockUser;