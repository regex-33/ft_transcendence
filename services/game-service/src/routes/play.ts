import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import fastifyWebsocket from '@fastify/websocket';

async function playRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
    fastify.register(fastifyWebsocket);
	fastify.get('/', { websocket: true}, async (socket, request) => {
        socket.send('hello')
	});
}

export default playRoutes;
