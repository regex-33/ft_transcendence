const { Notification } = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { Op } = require("sequelize");
module.exports = async (req, reply) => {
    const { check, payload } = await checkAuthJWT(req, reply);
    if (check) return;

    const { gameId } = req.params;
    if (!gameId || typeof gameId !== "string") {
        return reply.status(400).send({ error: "Invalid or missing gameId." });
    }

    try {
        const notification = await Notification.findOne({ where: { gameId, [Op.or]: [{ userId: payload.id }, { notifierId: payload.id }] } });
        if (!notification) {
            return reply.status(404).send({ error: "Notification not found." });
        }

        await notification.destroy();
        return reply.status(204).send();
    } catch (error) {
        require(`${process.env.PROJECT_PATH}/util/catch`)(error);
        return reply.status(500).send({ error: "An error occurred while deleting the notification." });
    }
}