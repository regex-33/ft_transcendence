const db = require('../../models');
const checkAuthJWT = require('../../util/checkauthjwt');
const getNotifications = async (req, reply) => {
    const { check, payload } = await checkAuthJWT(req);
    if (check) return;
    const username = payload.username;
    const { readed } = req.query;
    try {
        const user = await db.User.findOne({
            where: { username }
        })
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        const notifications = await db.Notification.findAll({
            where: readed ? { userId: user.id, readed } : { userId: user.id },
            attributes: ['userId', 'type', 'notifierId', 'readed', 'createdAt', 'gameId'],
            order: [['readed', 'ASC'], ['createdAt', 'DESC']]
        });
        await Promise.all(notifications.map(async notification => {
            notification.dataValues.gameId = notification.dataValues.gameId ? notification.dataValues.gameId : undefined;
            notification.dataValues.user = await db.User.findOne({
                where: { id: notification.notifierId },
                attributes: ['id', 'username', 'avatar']
            });
        })
        );
        await Promise.all(notifications
            .filter(notification => !notification.readed)
            .map(async notification => {
                if (notification.userId) {
                    await db.Notification.update(
                        { readed: true },
                        { where: { userId: notification.userId } }
                    );
                }
            })
        );
        return reply.status(200).send(notifications);
    } catch (error) {
        console.log("Error fetching notifications:", error);
        return reply.status(500).send({ error: 'Internal server error' });
    }
}

module.exports = getNotifications;
