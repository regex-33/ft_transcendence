const { User, Relationship } = require("../../models");
const { fillObject } = require("../../util/logger");

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
      fillObject(
        req,
        "INFO",
        "unblockAction",
        payload.username,
        true,
        "",
        req.cookies?.token || null
      );
      return reply.status(204).send();
    }
    fillObject(req, 'WARNING', 'unblockAction', payload.username, false, 'user not found', req.cookies?.token || null);
    return reply.status(404).send({ message: 'not found' });
  } catch (error) {
    fillObject(req, 'ERROR', 'unblockAction', payload.username, false, error.message, req.cookies?.token || null);
    console.log(error.message);
    return reply.status(500).send('internal server error');
  }
};

module.exports = unblockAction;
