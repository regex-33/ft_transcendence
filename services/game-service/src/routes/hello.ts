import type { FastifyInstance, FastifyPluginOptions } from "fastify";


async function hello(fastify: FastifyInstance, opts: FastifyPluginOptions) {
	fastify.get('/', async (request, reply) => {
		return { "hello": "world" };
	});
}


export default hello;
