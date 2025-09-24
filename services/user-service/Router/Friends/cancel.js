const { User, Relationship } = require("../../models");
const { Op } = require("sequelize");
const cancelFriendRequest = async (req, reply, payload, username) => {
  try {
    const friend = await User.findOne({ where: { username } });
    if (!friend) {
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
    return reply.status(200).send({ message: 'friend request canceled' });
  } catch (error) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(error);
    return reply.status(500).send({ message: 'internal server error' });
  }
};

module.exports = cancelFriendRequest;
