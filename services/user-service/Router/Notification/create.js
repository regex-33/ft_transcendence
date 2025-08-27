const db = require('../../models');
const checkAuthJWT = require('../../util/checkauthjwt');
const { fillObject } = require('../../util/logger');

const createNotification = async (req, reply) => {
    const { check, payload } = await checkAuthJWT(req);
    if (check || !payload) return;
    const { userId, type, id } = req.body;
    if (!userId || !type || !id) {
        return reply.status(400).send({ error: 'Missing userId, type or id' });
    }
    if (typeof userId !== 'number' || typeof type !== 'string' || typeof id !== 'number') {
        return reply.status(400).send({ error: 'Invalid userId, type or id' });
    }
    if (['MATCH_NOTIFICATION', 'MESSAGE', 'FRIEND_REQUEST'].includes(type)) {
        try {
            const notification = await db.Notification.create({
                userId,
                type,
                id
            });
            return reply.status(201).send(notification);
        } catch (error) {
            fillObject(req, 'ERROR', 'createNotification', payload.username, false, error.message, req.cookies?.token || null);
            console.log("Error creating notification:", error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    }
    else {
        fillObject(req, 'WARNING', 'createNotification', payload.username, false, 'Invalid notification type', req.cookies?.token || null);
        console.log("Invalid notification type:", type);
        return reply.status(400).send({ error: 'Invalid notification type' });
    }
}

module.exports = createNotification;

