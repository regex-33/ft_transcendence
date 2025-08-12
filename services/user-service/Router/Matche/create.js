const checkauthjwt = require('../../util/checkauthjwt');
const db = require('../../models');
const { fillObject } = require('../../util/logger');
const create = async (req, res) => {
    const { check, payload } = checkauthjwt(req,res);
    if (!check)
        return check;
    const userId = payload.id;
    const { type, players } = req.body;
    if (!userId || !type || !players) {
        fillObject(req, "WARNING", "createMatch", payload.username, false, "All fields are required", req.cookies?.token || null);
        return res.status(400).json({
            message: 'All fields are required'
        });
    }
    let valid_users;
    try {
        valid_users = await checkPlayers(players, type);
    } catch (error) {
        fillObject(req, "ERROR", "createMatch", payload.username, false, error.message, req.cookies?.token || null);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
    let match;
    try {
        const match = await db.Matche.create({
            type: type
        });
        valid_users.forEach((user, index) => {
            match.addUser(user, { team: players[index].team });
        });
    }
    catch (error) {
        fillObject(req, "ERROR", "createMatch", payload.username, false, error.message, req.cookies?.token || null);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
    return res.status(201).send();
}
const checkPlayers = async (players, type) => {
    const valid_users = await Promise.all(players.map(async (player) => {
        const user = await db.User.findOne({ where: { username: player.username, type: type } });
        if (!user || user.valid === false) {
            return null;
        }
        const matche = await db.Matche.findOne({ where: { playerId: user.id } });
        if (matche) {
            return null;
        }
        return user;
    }));
    if (valid_users.map(user => {
        return user.team == 'team1' ? user : null;
    }).length > 0 && valid_users.map(user => {
        return user.team == 'team2' ? user : null;
    }).length > 0) {
        return valid_users;
    }
    return null;
};

module.exports = { create };