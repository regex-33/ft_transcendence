try {
    const fastify = require('fastify')({ logger: false })
    const { solve, ifWin } = require('./src/ai');
    const db = require('./models');
    const GameRouter = require('./src/router');
    fastify.register(require('@fastify/cookie'));

    fastify.post('/xo-game/cell', async (request, reply) => {
        const { map } = request.body;
        if (!map) {
            reply.status(400);
            return { error: 'map is required' };
        }
        const win = ifWin(map);
        if (win.winner) return win;
        return { map: solve(map) };
    })
    fastify.register(GameRouter, { prefix: '/xo-game/' });
    db.sequelize.sync().then(() => {
        fastify.listen({ port: 8083, host: '0.0.0.0' })
            .then(address => {
                console.log(`Server listening at ${address}`)
            })
            .catch(err => {
                fastify.log.error(err)
                process.exit(1)
            })
    })
    // .catch(err=>{

    // })

} catch (err) {
    console.log(err);
}