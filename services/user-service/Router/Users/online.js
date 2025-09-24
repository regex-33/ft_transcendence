const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { Op } = require('sequelize');
const jwt = require('../../util/jwt');
const isOnline = async (req, res) => {
    const { check } = await checkAuthJWT(req, res);
    if (check) return check;
    const { username } = req.params;
    const user = await db.User.findOne({ where: { username } });
    if (!user) return res.status(404).send({ error: 'not found' });
    const sessions = await db.Session.findAll({
        where: {
            userId: user?.id,
            counter: {
                [Op.gt]: 0
            }
        }
    });
    return res.send({ online: sessions.length > 0 })
};

const setOnline = async (req, res) => {
    try {
        const { check, payload, session } = await checkAuthJWT(req, res);
        if (check) return check;
        req.user = payload;
        const { isOnline } = req.body;

        if (isOnline === undefined) {
            return res.status(400).send({ "message": "isOnline is required" });
        }

        const { username } = req.user;
        if (isOnline !== false && isOnline !== true) {
            return res.status(400).send({ "message": "isOnline must be boolean" });
        }

        session.counter += isOnline ? 1 : -1;
        await session.save();

        return res.status(201).send();
    } catch (error) {
        require(`${process.env.PROJECT_PATH}/util/catch`)(error);
        return res.status(500).send({ "message": "Internal server error" });
    }
};

async function onlineTracker(ws, req) {
    const { session_id, token } = req.cookies;

    try {
        const { payload } = await jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => { return decoded || {} });
        if (!payload) {
            ws.close();
            return;
        }
        const session = await db.Session.findOne({ where: { SessionId: session_id, userId: payload.id } });
        let active = true;
        if (!session) {
            ws.close();
            return;
        }
        db.Session.increment('counter', {
            by: 1,
            where: { id: session.id }
        });
        if (!session || !payload) {
            return;
        };
        const internalPing = setInterval(async () => {
            {
                const not = await db.Notification.findAll({ where: { userId: payload.id, readed: false } });
                if (not.length >= 0) {
                    ws.send((not.length && "start") || "stop");
                }
            }
            try {
                await session.reload();
            }
            catch (err) {
                require(`${process.env.PROJECT_PATH}/util/catch`)(err);
                ws.terminate();
                return;
            }
            if (!active) {
                ws.terminate();
                return;
            }
            try {
                active = false;
                ws.ping();
            } catch (err) {
                require(`${process.env.PROJECT_PATH}/util/catch`)(err);
            }
        }, 500);
        ws.on("pong", () => {
            active = true;
        });
        ws.on("close", async () => {
            internalPing && clearInterval(internalPing);
            active = false;
            await db.Session.decrement('counter', {
                by: 1,
                where: { id: session.id }
            });
        });
        ws.on("error", (err) => {
            internalPing && clearInterval(internalPing);
            active = false;
            require(`${process.env.PROJECT_PATH}/util/catch`)("ws closed because: " + err);
        });
    } catch (err) {
        require(`${process.env.PROJECT_PATH}/util/catch`)(err);
        ws.close();
        return;
    }
}

module.exports = { isOnline, setOnline, onlineTracker };