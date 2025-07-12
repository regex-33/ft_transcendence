const db = require("../../models");
const checkAuthJWT = require("../../middleware/checkauthjwt");
const { Op } = require("sequelize");
const createArray = async (array, id) => {
    return Promise.all(array.map(async (item) => {
        const friendId = item.from === id ? item.to : item.from;
        const user = await db.User.findOne({
            where: { id: friendId },
            attributes: ["id", "username", "image"]
        });
        console.log("User found:", user);
        if (user) {
            return {
                id: item.id,
                username: user.username,
                avatar: user.image
            };
        }
    }));
}

const getFriends = async (request, reply) => {
    const check = checkAuthJWT(request, reply);
    if (check)
        return check;
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

        reply.send(await createArray(friends, userId));
    } catch (error) {
        console.error("Error fetching friends:", error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
};

module.exports = getFriends;
