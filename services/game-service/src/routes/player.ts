import type { FastifyInstance, FastifyReply } from 'fastify';
import {
	getPlayerIdGamesSchema,
} from '../schemas';
import { createGame, getGame, joinGame } from '../controllers/gameController';
import { checkAuth } from '../controllers/checkAuth';
import { games, invites } from '../gameState';
import { createPlayer, getPlayerGames, getPlayerStats } from '../controllers/playerController';

async function playerRoutes(fastify: FastifyInstance) {
	fastify.addHook('preHandler', checkAuth);

	fastify.get('/games', async (request, reply) => {
		const user = (request as any).user;
		console.log('userid', user.id);
		const playerGames = await getPlayerGames(fastify.prisma, { id: user.id });
		reply.code(200).send(playerGames);
	});

	fastify.get('/stats', async (request, reply) => {
		const user = (request as any).user;
		console.log('userid', user.id);
		const playerGames = await getPlayerStats(fastify.prisma, user.id);
		reply.code(200).send(playerGames);
	});
	
	fastify.get('/', async (request, reply) => {
		const user = (request as any).user;
		console.log('userid', user.id);
		const player = await createPlayer(fastify.prisma, user);
		if (!player)
			reply.code(404).send({error: "failed to fetch player"});
		console.log(player);
		reply.code(200).send(player);
	});

	fastify.get<{ Params: { id: number } }>(
		'/:id/games',
		{ schema: getPlayerIdGamesSchema },
		async (request, reply) => {
			const { id } = request.params;
			const playerGames = await getPlayerGames(fastify.prisma, { id });
			reply.code(200).send(playerGames);
		}
	);
}

export default playerRoutes;
