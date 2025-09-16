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
    console.log(error.message);
    return reply.status(500).send('internal server error');
  }
};

module.exports = unblockAction;
