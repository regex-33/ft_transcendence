const checkAuthJWT = require("../../util/checkauthjwt");
const db = require("../../models");
const finished = async (req, res) => {
    const { check, payload } = checkAuthJWT(req, res);
    if (check) return check;
    const { MatchId } = req.body;
    const { id } = payload;
    if (!MatchId) {
        return res.status(400).send({ error: "MatchId is required." });
    }
    try {
        const matchId = await getMatchId({ MatchId, UserId: id });
        if (matchId === null) {
            return res.status(404).send({ error: "Match not found." });
        }
        if (matchId === undefined) {
            return res.status(500).send({ error: "Internal server error." });
        }
        const match = await db.Match.findByPk(MatchId);
        if (!match) {
            return res.status(404).send({ error: "Match not found." });
        }
        match.status = "LOCKED";
        await match.save();
        fillObject(req, "INFO", "finishMatch", id, true, "Match finished successfully.", req.cookies?.token || null);
        return res.send({ message: "Match finished successfully." });
    } catch (error) {
        return res.status(500).send({ error: "Internal server error." });
    }
};

const getMatchId = async (data) => {
    const { MatchId, UserId } = data;
    try {
        const MatchUser = await db.MatchUser.findOne({
            where: {
                MatchId,
                UserId: id
            },
        });
        if (!MatchUser)
            return null;
        return MatchUser;
    } catch (error) {
        return undefined;
    }
};

const addscore = async (req, res) => {
    const { check, payload } = checkAuthJWT(req, res);
    if (check) return check;
    const { MatchId, team, score } = req.body;
    const { id } = payload;
    if (!MatchId || !team || score === undefined) {
        return res.status(400).send({ error: "MatchId, team and score are required." });
    }
    try {
        const matchId = await getMatchId({ MatchId, UserId: id });
        if (matchId === null) {
            return res.status(404).send({ error: "Match not found." });
        }
        if (matchId === undefined) {
            return res.status(500).send({ error: "Internal server error." });
        }
        const match = await db.Match.findByPk(MatchId);
        if (!match) {
            return res.status(404).send({ error: "Match not found." });
        }
        match.score += score;
        await match.save();
        fillObject(req, "INFO", "addScore", id, true, "Score added successfully.", req.cookies?.token || null);
        return res.send({ message: "Score added successfully." });
    } catch (error) {
        return res.status(500).send({ error: "Internal server error." });
    }
};
