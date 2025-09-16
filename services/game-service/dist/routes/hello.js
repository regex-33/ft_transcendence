async function hello(fastify, opts) {
    fastify.get('/', async (request, reply) => {
        return { "hello": "world333" };
    });
}
export default hello;
//# sourceMappingURL=hello.js.map