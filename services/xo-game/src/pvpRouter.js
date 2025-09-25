const db = require('../models');
const { ifWin, solve } = require('./ai');
const jwt = require('./jwt');
const { Op } = require("sequelize");
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

const waitingList = new Map();
const players = new Map();

// make sure the connection is alive 
const heartbeat = (ws) => {
    ws.active = true;
    const interval = setInterval(() => {
        if (!ws.active) {
            ws.terminate();
            clearInterval(interval);
        }
        ws.active = false;
        ws.ping();
    }, 1000);
    ws.on('pong', () => {
        ws.active = true;
    });
}

const rev = (c) => {
    if (c == '-') return c;
    return c == 'X' ? 'O' : 'X';
}

const sendMap = (History) => {
    const map = JSON.parse(History.map_);
    console.log(History.turn, History.player, History.opponent);
    players.get(History.player)?.send(JSON.stringify({ type: 'update', map, turn: History.player === History.turn }));
    players.get(History.opponent)?.send(JSON.stringify({
        type: 'update',
        map: map.map(row => row.map(c => rev(c))),
        turn: History.turn === History.opponent
    }));
}

const sendMSG = (History, winner) => {
    players.get(History.player)?.send(JSON.stringify({ type: 'end', winner: winner.winner === 'X' ? "you win" : "you lose" }));
    players.get(History.opponent)?.send(JSON.stringify({ type: 'end', winner: winner.winner === 'O' ? "you win" : "you lose" }));
}

const handler = async (ws, req) => {
    const payload = await jwt.verify(req.cookies?.token, process.env.JWT_SECRET, (err, decoded) => {
        return err ? null : decoded;
    });
    let j = 0;
    if (!payload) {
        ws.send(JSON.stringify({ type: "noauth" }));
        ws.close();
        return;
    }
    heartbeat(ws);

    const History = await db.History.findOne({
        where: {
            [Op.or]: [
                { player: payload.id },
                { opponent: payload.id }
            ],
            opponent: { [Op.ne]: null },
            finished: false
        }
    });
    if (!History) {
        if (waitingList.size > 0 && waitingList.has(payload.id) == false) {
            try {
                const opponent = waitingList.entries().next().value;
                const newGame = await db.History.create({
                    player: opponent[0],
                    opponent: payload.id,
                    turn: opponent[0]
                });
                players.set(opponent[0], opponent[1]);
                players.set(payload.id, ws);
                waitingList.delete(opponent[0]);
                players.get(opponent[0])?.send(JSON.stringify({ type: 'start' }));
                ws?.send(JSON.stringify({ type: 'start' }));
                sendMap(newGame);
            } catch (error) {
                require(`${process.env.PROJECT_PATH}/src/catch`)(error);
                ws.terminate();
            }
        } else if (waitingList.has(payload.id) == false) {
            waitingList.set(payload.id, ws);
            ws.send(JSON.stringify({ type: 'wait' }));
        } else {
            require(`${process.env.PROJECT_PATH}/src/catch`)(`undefined behavior for player ${payload.id} number of waiting players: ${waitingList.size}`);
        }
    }
    else {
        players.set(payload.id, ws);
        sendMap(History);
    }
    ws.on('message', async (message) => { await onmessage(payload, message) });
    ws.on('close', (err) => onclose(payload, waitingList, players));
    ws.on('error', (err) => { require(`${process.env.PROJECT_PATH}/src/catch`)(err); ws.terminate(); });
}


const onmessage = async (payload, message) => {
    if (players.has(payload.id) == false) return;
    let History;
    try {
        History = await db.History.findOne({
            where: {
                [Op.or]: [
                    { player: payload.id },
                    { opponent: payload.id }
                ],
                opponent: { [Op.ne]: null },
                finished: false
            }
        });
        if (!History) return;
        const map = JSON.parse(History.map_);
        const data = JSON.parse(message);
        if (data.type != 'move' || !validateMap(map, data.cell)) {
            players.get(payload.id).send(JSON.stringify({ type: 'error' }));
            return;
        }
        map[data.cell.y][data.cell.x] = History.player == payload.id ? 'X' : 'O';
        History.turn = History.turn == History.player ? History.opponent : History.player;
        sendMap(History, payload);
        const winner = ifWin(map);
        History.map_ = JSON.stringify(map);
        await History.save();
        if (winner.winner) {
            sendMSG(History, winner);
            History.finished = true;
            History.win = winner.winner === 'X' ? History.player : winner.winner === 'O' ? History.opponent : 0;
            History.winner = payload.id;
            await History.save();
        }
    } catch (error) {
        require(`${process.env.PROJECT_PATH}/src/catch`)(error);
        players.get(payload.id)?.send(JSON.stringify({ type: 'error' }));
        return;
    }
}
const onclose = async (payload, waitingList, players) => {
    waitingList.delete(payload.id);
    players.delete(payload.id);
}

const pvpRouter = (fastify) => {
    fastify.get('/handler', { websocket: true }, handler);
}

module.exports = pvpRouter;

