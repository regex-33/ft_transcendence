const db = require('../models');
const { ifWin, solve } = require('./ai');
const jwt = require('./jwt');

const validateMap = (oldmap, cell) => {
    if (!(cell && typeof cell.x == "number" &&
        typeof cell.y == "number" &&
        cell.x >= 0 &&
        cell.x <= 2 &&
        cell.y <= 2 &&
        cell.y >= 0))
        return false;
    if (oldmap[cell.y][cell.x] == '-')
        return true;
    return false;
}


const saveMap = async (History, oldmap, win) => {
    History.map_ = JSON.stringify(oldmap);
    await History.save();
    if (win.winner) {
        History.win = win.winner == 'X';
        History.finished = true;
        await History.save();
    }
}
const play = async (request, reply) => {
    const payload = await jwt.verify(request.cookies?.token, process.env.JWT_SECRET, (err, decoded) => {
        return err ? null : decoded;
    });
    if (!payload) {
        return reply.status(401).send({
            err: "not Authorized"
        });
    }
    const { cell } = request.body;
    try {

        const History = await db.History.findOne({
            where: {
                player: payload.id,
                finished: false
            }
        });
        if (!History) {
            return reply.status(400).send({ msg: 'no game for you' })
        }
        const oldmap = JSON.parse(History.map_);
        if (!validateMap(oldmap, cell))
            return reply.status(400).send({ 'err': "bad request" });

        oldmap[cell.y][cell.x] = 'X';
        let win = ifWin(oldmap)
        await saveMap(History, oldmap, win)
        if (win.winner) {
            return reply.send({
                map: oldmap,
                winner: win.winner == 'X' ? 'OK' : 'KO'
            });
        }
        const ma = solve(oldmap);
        win = ifWin(ma)
        await saveMap(History, ma, win)
        return reply.send({ map: ma, win: win.winner ? (win.winner == 'X' ? 'OK' : 'KO') : undefined });
    } catch (error) {
        require(`${process.env.PROJECT_PATH}/src/catch`)(error);
        return reply.status(500).send({ err: 'internal server error' });
    }
}

const reset = async (req, res) => {
    const payload = await jwt.verify(req.cookies?.token, process.env.JWT_SECRET, (err, decoded) => {
        return err ? null : decoded;
    });
    if (!payload) {
        return res.status(401).send({
            err: "not Authorized"
        });
    }
    const [History, created] = await db.History.findOrCreate({
        where: { player: payload.id, finished: false },
        defaults: { player: payload.id }
    });
    if (!created)
        History.map_ = JSON.stringify([["-", "-", "-"], ["-", "-", "-"], ["-", "-", "-"]]);
    await History.save();
    return res.send({ map: JSON.parse(History.map_) });
}

const create = async (request, res) => {
    try {
        const payload = await jwt.verify(request.cookies?.token, process.env.JWT_SECRET, (err, decoded) => {
            return err ? null : decoded;
        });
        if (!payload) {
            return res.status(401).send({
                err: "not Authorized"
            });
        }

        try {
            const [History, created] = await db.History.findOrCreate({
                where: { player: payload.id, finished: false },
                defaults: { player: payload.id }
            });
            return res.send({
                map: JSON.parse(History.map_)
            })
        } catch (error) {
            require(`${process.env.PROJECT_PATH}/src/catch`)(error);
            return res.status(500).send({ err: 'internal server error' });
        }
    }
    catch (error) {
        require(`${process.env.PROJECT_PATH}/src/catch`)(error);
        return res.status(500).send({ err: 'internal server error' });
    }
}

const AiRouter = (fastify) => {
    fastify.post('/create', create);
    fastify.post('/play', play);
    fastify.delete('/reset', reset);
    fastify.get('/history/:id', async (req, res) => {
        try {
            const payload = await jwt.verify(req.cookies?.token, process.env.JWT_SECRET, (err, decoded) => {
                return err ? null : decoded;
            });
            if (!payload) {
                return res.status(401).send({
                    err: "not Authorized"
                });
            }
            const { id } = req.params;
            let nid = id;
            try {
                nid = Number(id);
            } catch (error) {
                return res.status(400).send({ 'msg': 'bad request' });
            }
            if (typeof nid != "number") {
                return res.status(400).send({ 'msg': 'bad request' });
            }
            const History = await db.History.findOne({
                where: {
                    [Op.or]: [
                        { player: payload.id },
                        { opponent: payload.id }
                    ],
                    opponent: { [Op.ne]: null },
                    finished: true
                }
                , attributes: ['player', 'map_', 'win', 'updatedAt']
            });
            const edited = History.map(game => ({
                win: game.win == id,
                map: JSON.parse(game.map_),
                date: game.updatedAt
            }));
            return res.send(edited);
        } catch (error) {
            require(`${process.env.PROJECT_PATH}/src/catch`)(error);
            return res.status(500).send({ "msg": "internal server error" });
        }
    })
}

module.exports = AiRouter;