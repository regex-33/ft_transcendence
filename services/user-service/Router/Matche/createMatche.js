const db = require('../../models');
const checkAuthJWT = require('../../util/checkauthjwt');
const { fillObject } = require('../../util/logger');

const createMatch = async (request, reply) => {
    const { check } = checkAuthJWT(request, reply);
    if (check) return check;

    try {
        const { type, players } = request.body;
        if (!type || !['CLASSIC', 'VANISH', 'SPEED', 'GOLD'].includes(type)) {
            fillObject(request, "WARNING", "createMatch", "unknown", false, "Match type is required.", request.cookies?.token || null);
            return reply.status(400).send({ error: "Match type is required." });
        }
        const playersList = await checkPlayers(players);
        let match;
        try {
            match = await db.Matche.create({ type });
            playersList.forEach((player, index) => {
                match.addUser(player, { through: { team: players[index].team || 'RED' } });
            });
            await match.save();
        }
        catch (error) {
            fillObject(request, "ERROR", "createMatch", "unknown", false, error.message, request.cookies?.token || null);
            console.error("Error creating match:", error);
            return reply.status(500).send({ error: "Internal server error." });
        }
        fillObject(request, "INFO", "createMatch", match.id, true, "", request.cookies?.token || null);
        console.log("Match created successfully:", match);
        return reply.status(201).send(match);
    } catch (error) {
        fillObject(request, "ERROR", "createMatch", "unknown", false, error.message, request.cookies?.token || null);
        console.error("Error creating match:", error);
        return reply.status(500).send({ error: "Internal server error." });
    }
};

const checkPlayers = async (players) => {
    try {
        let isValid = [];
        const playersobj = await Promise.all(players.map(async (player) => {
            if (!player.username) {
                throw new Error("Invalid player username format.");
            }
            const user = await db.User.findOne({ where: { username: player.username } });
            if (!user || !user.valid) {
                throw new Error(`User ${player.username} not found or invalid.`);
            }
            if (!isValid.includes(user.team))
                isValid.push(user.team);
            return user;
        }));
        if (playersobj.length !== players.length) {
            throw new Error("Not all players are valid.");
        }
        if (isValid.length < 2) {
            throw new Error("At least two different teams are required.");
        }
        return playersobj;
    } catch (error) {
        return null;
    }
}

module.exports = createMatch;
