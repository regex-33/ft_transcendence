const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { Op } = require("sequelize");
const { fillObject } = require("../../util/logger");
const createArray = async (array, id) => {
    return Promise.all(array.map(async (item) => {
        const friendId = item.from === id ? item.to : item.from;
        const user = await db.User.findOne({
            where: { id: friendId },
            attributes: ["id", "username", "avatar", "name", "email", "bio"]
        });

        if (user) {
            return {
                id: friendId,
                username: user.username,
                avatar: user.avatar,
                name: user.name,
                email: user.email,
                bio: user.bio,
            };
        }
    }));
}

const getFriends = async (request, reply) => {
    const { check, payload } = await checkAuthJWT(request, reply);
    if (check) return check;
    request.user = payload;
    const userId = request.user.id;
    
    try {
        const friends = await db.Relationship.findAll({
            where: {
                status: 'friend',
                [Op.or]: [
                    { from: userId },
                    { to: userId }
                ]
            }
        });
        fillObject(request, "INFO", "getFriends", userId, true, "", request.cookies?.token || null);
        reply.send(await createArray(friends, userId));
    } catch (error) {
        fillObject(request, "ERROR", "getFriends", userId, false, error.message, request.cookies?.token || null);
        console.error("Error fetching friends:", error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};

module.exports = getFriends;
