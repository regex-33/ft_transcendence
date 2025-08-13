const checkauthjwt = require('../../util/checkauthjwt');
const db = require('../../models');
const { fillObject } = require('../../util/logger');
const create = async (req, res) => {
    const { check, payload } = await checkauthjwt(req, res);
    if (check)
        return check;
    console.log(check, payload);
    const userId = payload?.id;
    const { type, players } = req.body;
    if (!userId || !type || !players) {
        fillObject(req, "WARNING", "createMatch", payload?.username, false, "All fields are required", req.cookies?.token || null);
        return res.status(400).send({
            message: 'All fields are required'
        });
    }
    let valid_users;
    try {
        valid_users = await checkPlayers(players, type);
        if (!valid_users || valid_users.filter(user => user !== null).length != players.length) {
            fillObject(req, "WARNING", "createMatch", payload?.username, false, "Invalid players", req.cookies?.token || null);
            return res.status(400).send({
                message: 'Invalid players'
            });
        }
    } catch (error) {
        fillObject(req, "ERROR", "createMatch", payload?.username, false, error.message, req.cookies?.token || null);
        console.log("err:", error);
        return res.status(500).send({
            message: 'Internal server error'
        });
    }

    try {
        const match = await db.Matche.create({
            type: type
        });
        for (let i = 0; i < valid_users.length; i++) {
            const user = valid_users[i];
            await match.addUser(user, { through: { team: players[i].team } });
        }
        await match.save();
    }
    catch (error) {
        fillObject(req, "ERROR", "createMatch", payload.username, false, error.message, req.cookies?.token || null);
        console.log("err:", error);
        return res.status(500).send({
            message: 'Internal server error'
        });
    }
    fillObject(req, "INFO", "createMatch", payload.username, true, "Match created successfully", req.cookies?.token || null);
    return res.status(201).send({ 'success': true });
}
const checkPlayers = async (players, type) => {
    const valid_users = await Promise.all(players.map(async (player) => {
        const user = await db.User.findOne({ where: { username: player.username, type: type } });
        if (!user || user.valid === false) {
            return null;
        }
        const matche = await db.Matche.findAll({
            where: { status: 'LIVE' }, include: [
                { model: db.User, where: { id: user.id ,type }, attributes: ['id'] }
            ]
        });
        if (matche.length) {
            return null;
        }
        return user;
    }));
    const hasTeam1 = players.filter(p => p.team === 'team1');
    const hasTeam2 = players.filter(p => p.team === 'team2');
    if (hasTeam1.length > 0 && hasTeam2.length > 0) {
        return valid_users;
    }
    return null;
};

module.exports = { create };
