const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");

const createNotification = async (req, reply) => {
  const { check, payload } = await checkAuthJWT(req, reply);
  if (check || !payload) return;
  const { userId, type, gameId } = req.body;

  if (!userId || !type)
    return reply.status(400).send({ error: "Missing userId, type or id" });
  if (
    typeof userId !== "number" ||
    typeof type !== "string" ||
    (gameId && typeof gameId !== "string")
  )
    return reply.status(400).send({ error: "bad request" });

  if (["MATCH_NOTIFICATION", "FRIEND_REQUEST"].includes(type)) {
    try {
      await db.Notification.create({
        userId,
        type,
        gameId,
        notifierId: payload.id,
      });
      return reply.status(201).send({
        userId,
        notifierId: payload.id,
        type,
      });
    } catch (error) {
      require(`${process.env.PROJECT_PATH}/util/catch`)(error);
      return reply
        .status(500)
        .send({ error: "Internal server error." + error });
    }
  } else {
    return reply.status(400).send({ error: "Invalid notification type" });
  }
};

module.exports = createNotification;
