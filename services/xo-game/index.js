try {
    const fastify = require('fastify')({ logger: false })
    const websocket = require('@fastify/websocket');
    const { solve, ifWin } = require('./src/ai');
    const db = require('./models');
    const AiRouter = require('./src/aiRouter');
    const pvpRouter = require('./src/pvpRouter');
    fastify.register(require('@fastify/cookie'));
    fastify.register(websocket).then(() => {
        fastify.register(AiRouter, { prefix: '/xo-game/ai' });
        fastify.register(pvpRouter, { prefix: '/xo-game/pvp' });

        fastify.addHook('onResponse', (request, reply, done) => {
            console.log(`${request.method} ${request.url} ${reply.statusCode}`);
            done();
        });
        db.sequelize.sync().then(() => {
            fastify.listen({ port: 8083, host: '0.0.0.0' })
                .then(address => {
                    console.log(`Server listening at ${address}`)
                })
                .catch(err => {
                    require(`${process.env.PROJECT_PATH}/src/catch`)(err);
                    process.exit(1)
                })
        })
        .catch(err=>{
            require(`${process.env.PROJECT_PATH}/src/catch`)(err);
        })

    });
} catch (err) {
    require(`${process.env.PROJECT_PATH}/src/catch`)(err);
}