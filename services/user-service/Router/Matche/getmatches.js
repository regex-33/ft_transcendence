const checkAuthJWT = require("../../utils/checkAuthJWT");
const db = require("../../models");
const { fillObject } = require("../../utils/logs");
const { time } = require("speakeasy");

module.exports = async (req, res) => {
    const { check, payload } = checkAuthJWT(req, res);
    if (check) return check;
    
    const { username } = req.params;

    const user = await getUser(username);
    if (user === null) {
        return res.status(404).send({ error: "User not found." });
    }
    if (user === undefined) {
        return res.status(500).send({ error: "Internal server error." });
    }

    const matches = await getMatches(user.id);
    if (matches === null) {
        return res.status(500).send({ error: "Internal server error." });
    }
    if (matches.length === 0) {
        return res.status(404).send({ error: "No matches found for this user." });
    }

    new_matches = matches.map(match => {
        return {
            id: match.id,
            type: match.type,
            score: `${match.redscore}-${match.bluescore}`,
            time: match.time,
            status: match.status,
            users: {
                red: match.Users.filter(user => user.MatcheUser.team === 'RED').map(user => ({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar
                })),
                blue: match.Users.filter(user => user.MatcheUser.team === 'BLUE').map(user => ({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar
                }))
            }
        };
    });
    res.send(new_matches);
}

const getUser = async (username) => {
    try {
        if (!username) {
            throw new Error("Username is required");
        }
        return await db.User.findOne({
            where: { username },
            attributes: ['id', 'username', 'email']
        });
    } catch (error) {
        fillObject(error);
        return null;
    }
}

const getMatches = async (userId) => {
    try {
        return await db.Matche.findAll({
            where: { UserId: userId },
            include: [
                {
                    model: db.User,
                    attributes: ['id', 'username', 'email', 'avatar'],
                    through: {
                        attributes: ['team']
                    }
                }
            ]
        });
    } catch (error) {
        fillObject(error);
        return null;
    }
}