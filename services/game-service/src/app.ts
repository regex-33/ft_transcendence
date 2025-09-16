import Fastify, { type FastifyInstance } from 'fastify';
import { GameStatus, GameType, PrismaClient } from '../generated/prisma';
import clientPlugin from './client-plugin';
import gameRoutes from './routes/game';
//import fastifySwagger from '@fastify/swagger';

const fastify = Fastify({ logger: true });

//await fastify.register(fastifySwagger, {
//	openapi: {
//		openapi: '3.0.0',
//		info: {
//			title: 'Pong Game API',
//			description: 'Pong Game API',
//			version: '0.1.0'
//		},
//		tags: [
//			{ name: 'Game', description: 'Game related end-points' },
//		],
//		components: {
//			securitySchemes: {
//				apiKey: {
//					type: 'apiKey',
//					name: 'apiKey',
//					in: 'header'
//				}
//			}
//		},
//	},
//})

fastify.addSchema({
	$id: 'GameStatus',
	type: 'string',
	enum: Object.values(GameStatus)
})

fastify.addSchema({
	$id: "Error",
	type: 'object',
	properties:
	{
		error: {type: "string"}
	}
})

fastify.addSchema({
	$id: 'GameType',
	type: 'string',
	enum: Object.values(GameType)
})

fastify.register(clientPlugin);

fastify.register(gameRoutes, { prefix: '/game' });

fastify.listen({
	port: 3000,
	host: '::'
}, function(err) {
	if (err) {
		console.log("something went wrong:", err);
		fastify.log.error(err);
		process.exit(1);
	}
});

await fastify.ready();
//const swaggerSpec = fastify.swagger();
//import fs from 'fs'
//fs.writeFileSync('openapi.json', JSON.stringify(swaggerSpec, null, 2))
