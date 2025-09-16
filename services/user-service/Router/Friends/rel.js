const db = require("../../models");
const { Op } = require("sequelize");
const checkAuthJWT = require("../../util/checkauthjwt");
module.exports = async (request, reply) => {
    const { check, payload } = await checkAuthJWT(request, reply);
    if (check) return check;
    const userId = payload.id;
    const otherId = request.params.id;
    if (isNaN(otherId)) {
        return reply.status(400).send({ error: "Invalid user id" });
    }
    try {
        const relation = await db.Relationship.findOne({
            where: {
                [Op.or]: [
                    { userId: userId, otherId: otherId },
                    { userId: otherId, otherId: userId }
                ]
            }
        });
        if (!relation) {
            return reply.send({ status: null });
        }
        reply.send({ status: relation.status });
    } catch (error) {
        console.error("Error fetching relationship:", error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
}