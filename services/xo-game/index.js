const fastify = require('fastify')({ logger: false })
const { solve, ifWin } = require('./src/ai');
fastify.post('/xo-game/cell', async (request, reply) => {
    const { map } = request.body;
    if (!map) {
        reply.code(400);
        return { error: 'map is required' };
    }
    const win = ifWin(map);
    if (win.winner) return win;
    return { map: solve(map) };
})

fastify.listen({ port: 8083, host: '0.0.0.0' })
    .then(address => {
        console.log(`Server listening at ${address}`)
    })
    .catch(err => {
        fastify.log.error(err)
        process.exit(1)
    })
