const db = require('../../models');
const checkAuthJWT = require('../../util/checkauthjwt');
const { fillObject } = require('../../util/logger');
const getNotifications = async (req, reply) => {
    const { check, payload } = await checkAuthJWT(req);
    if (check) return;
    const username = req.params.username || payload.username;
    const { readed } = req.query;
    try {
        const user = await db.User.findOne({
            where: { username } 
        })
        if (!user) {
            fillObject(req, 'WARNING', 'getNotifications', payload.username, false, 'user not found', req.cookies?.token || null);
            return reply.status(404).send({ error: 'User not found' });
        }
        const notifications = await db.Notification.findAll({
            where: readed ? { userId: user.id, readed } : { userId: user.id },
            attributes: ['id', 'type', 'readed', 'createdAt'] // Ensure 'id' is included
        });
        await Promise.all(notifications
            .filter(notification => !notification.readed)
            .map(async notification => {
                if (notification.id) {
                    await db.Notification.update(
                        { readed: true },
                        { where: { id: notification.id } }
                    );
                }
            })
        );
        return reply.status(200).send(notifications);
    } catch (error) {
        fillObject(req, 'ERROR', 'getNotifications', payload.username, false, error.message, req.cookies?.token || null);
        console.log("Error fetching notifications:", error);
        return reply.status(500).send({ error: 'Internal server error' });
    }
}

module.exports = getNotifications;
