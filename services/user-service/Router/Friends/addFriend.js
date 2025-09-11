const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");
const { User } = db;

const addFriend = async (request, reply) => {
  const { check, payload } = await checkAuthJWT(request, reply);
  if (check) return;
  const id = payload.id;
  const { username } = request.body;

  if (!username || typeof username !== "string") {
    fillObject(
      request,
      "WARNING",
      "addFriend",
      id,
      false,
      "Username is required.",
      request.cookies?.token || null
    );
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
        fillObject(request, "WARNING", "addFriend", id, false, "can't add yourself as a friend", request.cookies?.token || null);
        return reply.status(400).send({ error: "You can't add yourself as a friend." });
      }
      if (
        (await user.hasOther(friend)) ||
        (await friend.hasOther(user))
      ) {
        return reply.status(400).send({ error: "friend can't be added" });
      }
    } else {
      fillObject(
        request,
        "WARNING",
        "addFriend",
        payload.username,
        false,
        "User not found.",
        request.cookies?.token || null
      );
      return reply.status(404).send({ error: "User not found." });
    }
    await user.addOther(friend);
    await db.Notification.create({
      userId: friend.id,
      type: 'FRIEND_REQUEST',
      notifierId: user.id
    });
    return reply.status(201).send({
      message: "Friend added successfully",
    });
  } catch (error) {
    fillObject(
      request,
      "ERROR",
      "addFriend",
      payload.username,
      false,
      error.message,
      request.cookies?.token || null
    );
    console.log("Error fetching user or friend:", error);
    return reply.status(500).send({ error: "Internal server error." });
  }
};

module.exports = addFriend;
