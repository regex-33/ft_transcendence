const checkAuthJWT = require('../../util/checkauthjwt');
const db = require('../../models');
const { fillObject } = require('../../util/logger');

const getMatch = async (req, res) => {
    try {
        const { check, payload } = await checkAuthJWT(req, res);
        if (check) {
            return check;
        }

        const { id } = req.params;
        const [match] = await db.Matche.findAll({
            where: { id },
            include: [
                {
                    model: db.User,
                    attributes: ['id', 'username', 'avatar'],
                    through: { attributes: ['team'] }
                }
            ]
        });

        if (!match) {
            fillObject(req, "WARNING", 'GETMATCH', payload.username, false, 'match not found', req.cookies?.token || null);
            return res.status(404).send({ error: 'Match not found' });
        }

        const { Users = [], ...matchData } = match.toJSON();
        const users = Users.map(u => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar
        }));
        fillObject(req, "INFO", 'GETMATCH', payload.username, true, 'match found', req.cookies?.token || null);
        return res.status(200).send({ ...matchData, users });
    } catch (error) {
        fillObject(req, "ERROR", 'GETMATCH', 'unknown', false, error.message, error);
        console.log(error);
        return res.status(500).send({ error: 'Internal server error' });
    }
}

const getMatchs = async (req, res) => {
    const { check } = await checkAuthJWT(req, res);
    if (check) {
        return check;
    }
    const { username } = req.params;
    try {
        const matchs = await db.Matche.findAll({
            include: [
                {
                    model: db.User,
                    where: { username },
                    attributes: ['id', 'username', 'avatar'],
                    through: { attributes: ['team'] }
                }
            ]
        });
        if (!matchs || matchs.length === 0) {
            fillObject(req, "WARNING", 'GETMATCHS', username, false, 'no matches found', null);
            return res.status(404).send({ error: 'No matches found' });
        }
        fillObject(req, "INFO", 'GETMATCHS', username, true, 'matches found', matchs.map(m => m.id));
        return res.status(200).send(matchs);
    } catch (error) {
        fillObject(req, "ERROR", 'GETMATCHS', username, false, error.message, error);
        return res.status(500).send({ error: 'Internal server error' });
    }
}

module.exports = { getMatch, getMatchs };