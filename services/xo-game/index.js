const fastify = require('fastify')({ logger: true })

fastify.get('/xo-game', async (request, reply) => {
    return { hello: 'world' }
})

fastify.listen({ port: 8083, host: '0.0.0.0' })
    .then(address => {
        console.log(`Server listening at ${address}`)
    })
    .catch(err => {
        fastify.log.error(err)
        process.exit(1)
    })
