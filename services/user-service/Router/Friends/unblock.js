const { User, Relationship } = require("../../models");

const unblockAction = async (req, reply, payload, ...inputs) => {

  const [userId, username] = inputs;
  try {
    const blocked = await User.findOne({ where: { username } });
    if (blocked) {
      await Relationship.destroy({
        where: {
          userId: userId,
          otherId: blocked.id,
        },
      });
      return reply.status(204).send();
    }
    return reply.status(404).send({ message: 'not found' });
  } catch (error) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(error);
    return reply.status(500).send('internal server error');
  }
};

module.exports = unblockAction;
