import Fastify, { type FastifyInstance } from 'fastify';
import {
    GameStatus,
    GameType,
    GameMode,
    PrismaClient,
} from '../generated/prisma';
import clientPlugin from './client-plugin';
import gameRoutes from './routes/game';
import playRoutes from './routes/play';
import fastifyCookie from '@fastify/cookie';
import fastifyWebsocket from '@fastify/websocket';
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
    enum: Object.values(GameStatus),
});

fastify.addSchema({
    $id: 'GameType',
    type: 'string',
    enum: Object.values(GameType),
});

fastify.addSchema({
    $id: 'GameMode',
    type: 'string',
    enum: Object.values(GameMode),
});

fastify.addSchema({
    $id: 'Error',
    type: 'object',
    properties: {
        error: { type: 'string' },
    },
});

fastify.register(fastifyCookie);

fastify.register(clientPlugin);
fastify.register(fastifyWebsocket);

fastify.register(gameRoutes, { prefix: '/game' });

fastify.register(playRoutes, { prefix: '/play' });

fastify.listen(
    {
        port: 3000,
        host: '::',
    },
    function (err) {
        if (err) {
            console.log('something went wrong:', err);
            fastify.log.error(err);
            process.exit(1);
        }
    }
);

await fastify.ready();
//const swaggerSpec = fastify.swagger();
//import fs from 'fs'
//fs.writeFileSync('openapi.json', JSON.stringify(swaggerSpec, null, 2))
