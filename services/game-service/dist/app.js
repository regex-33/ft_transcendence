import Fastify from 'fastify';
import hello from './routes/hello.js';
const fastify = Fastify({ logger: true });
fastify.get('/echo', function (request, reply) {
    reply.send("ehello");
});
fastify.register(hello);
fastify.listen({
    port: 3000,
    host: '::'
}, function (err, address) {
    if (err) {
        //console.log("something went wrong:", err);
        fastify.log.error(err);
        process.exit(1);
    }
});
//# sourceMappingURL=app.js.map