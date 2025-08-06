const checkAuthJWT = require('../../util/checkauthjwt');
const { fillObject } = require('../../util/logger');
const db = require('../../models');

const getMatche = async (request, reply) => {
    const { check } = checkAuthJWT(request, reply);

    if (check) return check;
    try {
        const { id } = request.params;
        if (!id) {
            fillObject(request, "WARNING", "getMatche", "unknown", false, "Match ID is required.", request.cookies?.token || null);
            return reply.status(400).send({ error: "Match ID is required." });
        }

        const match = await db.Matche.findByPk(id, {
            include: [{ model: db.User, attributes: { exclude: ['password', 'isValid', 'identifier', 'friends', 'bio', 'createdAt', 'updatedAt'] }, through: { attributes: ['team'] } }]
        });

        if (!match) {
            fillObject(request, "WARNING", "getMatche", id, false, "Match not found.", request.cookies?.token || null);
            return reply.status(404).send({ error: "Match not found." });
        }

        fillObject(request, "INFO", "getMatche", match.id, true, "", request.cookies?.token || null);
        return reply.status(200).send(match);
    } catch (error) {
        fillObject(request, "ERROR", "getMatche", "unknown", false, error.message, request.cookies?.token || null);
        console.error("Error fetching match:", error);
        return reply.status(500).send({ error: "Internal server error." });
    }
};

module.exports = getMatche;