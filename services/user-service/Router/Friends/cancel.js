const { User, Relationship } = require("../../models");
const { Op } = require("sequelize");
const { fillObject } = require("../../util/logger");
const cancelFriendRequest = async (req, reply, payload, username) => {
  try {
    const friend = await User.findOne({ where: { username } });
    if (!friend) {
      fillObject(req, 'WARNING', 'cancelFriendRequest', payload.username, false, 'user not found', req.cookies?.token || null);
      return reply.status(404).send({ message: 'not found' });
    }
    await Relationship.destroy({
      where: {
        [Op.or]: [
          { userId: payload.id, otherId: friend.id },
          { userId: friend.id, otherId: payload.id }
        ],
        status:["pending", "friend"]
      }
    });
    fillObject(req, 'INFO', 'cancelFriendRequest', payload.username, true, 'friend request canceled', req.cookies?.token || null);
    return reply.status(200).send({ message: 'friend request canceled' });
  } catch (error) {
    fillObject(req, 'ERROR', 'cancelFriendRequest', payload.username, false, error.message, req.cookies?.token || null);
    console.log("Error canceling friend request:", error);
    return reply.status(500).send({ message: 'internal server error' });
  }
};

module.exports = cancelFriendRequest;
