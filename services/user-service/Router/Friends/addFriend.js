const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { logger } = require("../../util/logger");
const { User } = db;

const addFriend = async (request, reply) => {
  const { check, payload } = await checkAuthJWT(request, reply);
  if (check) return;
  const id = payload.id;
  const { username } = request.body;

  if (!username || typeof username !== "string") {
    return reply.status(400).send({});
  }
  let friend, user;
  try {
    [friend, user] = await Promise.all([
      User.findOne({ where: { username } }),
      User.findByPk(id),
    ]);

    if (friend && user) {
      if (friend.id === user.id) {
        return reply.status(400).send({ error: "You can't add yourself as a friend." });
      }
      if (
        (await user.hasOther(friend)) ||
        (await friend.hasOther(user))
      ) {
        return reply.status(400).send({ error: "friend can't be added" });
      }
    } else {
      return reply.status(404).send({ error: "User not found." });
    }
    await user.addOther(friend);
    logger(request, "INFO", "addFriend", user.id, true, null, request.cookies?.token || null);
    await db.Notification.create({
      userId: friend.id,
      type: 'FRIEND_REQUEST',
      notifierId: user.id
    });
    return reply.status(201).send({
      message: "Friend added successfully",
    });
  } catch (error) {
    require(`${process.env.PROJECT_PATH}/util/catch`)(error);
    return reply.status(500).send({ error: "Internal server error." });
  }
};

module.exports = addFriend;
