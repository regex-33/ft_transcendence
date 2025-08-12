const checkauthjwt = require('../../util/checkauthjwt');
const db = require('../../models');
const { fillObject } = require('../../util/logger');

const addscore = async (req, res) => {
    const { check, payload } = checkauthjwt(req,res);
    if (!check)
        return check;
    const userId = payload.id;
    const { matchId, score } = req.body;
    try {
        const match = await db.Match.findOne({
            where: {
                id: matchId,
                status: 'LIVE'
            },
            include: [{
                model: db.User,
                where: { id: userId }
            }]
        });

        if (!match) {
            fillObject(req, "WARNING", 'ADDSCORE', payload.username, false, 'match not found', matchId);
            return res.status(404).send({ error: 'Not found' });
        }
        match.score1 += score.team == 'team1' ? score.score : 0;
        match.score2 += score.team == 'team2' ? score.score : 0;

        await match.save();
        fillObject(req, "INFO", 'ADDSCORE', payload.username, true, 'score added', matchId);
        return res.status(200).send();
    } catch (error) {
        fillObject(req, "ERROR", 'ADDSCORE', payload.username, false, error.message, error);
        return res.status(500).send({ error: 'Internal server error' });
    }
};


const finish = async (req,res) => {
    const { check, payload } = checkauthjwt(req,res);
    if (!check)
        return check;
    const userId = payload.id;
    const { matchId } = req.body;

    try {
        const match = await db.Match.findOne({
            where: {
                id: matchId,
                status: 'LIVE'
            },
            include: [{
                model: db.User,
                where: { id: userId }
            }]
        });

        if (!match) {
            fillObject(req, "WARNING", 'FINISH', payload.username, false, 'match not found', matchId);
            return res.status(404).send({ error: 'Not found' });
        }

        match.status = 'FINISHED';
        await match.save();
        fillObject(req, "INFO", 'FINISH', payload.username, true, 'match finished', matchId);
        return res.status(200).send();
    } catch (error) {
        fillObject(req, "ERROR", 'FINISH', payload.username, false, error.message, error);
        return res.status(500).send({ error: 'Internal server error' });
    }
}

module.exports = {
    addscore,
    finish
};