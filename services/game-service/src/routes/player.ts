import type { FastifyInstance, FastifyReply } from 'fastify';
import {
	createGameSchema,
	getGameSchema,
	getPlayerIdGamesSchema,
	inviteGameSchema,
	joinGameSchema,
} from '../schemas';
import { createGame, getGame, joinGame } from '../controllers/gameController';
import { checkAuth } from '../controllers/checkAuth';
import { games, invites } from '../gameState';
import { getPlayerGames, getPlayerStats } from '../controllers/playerController';

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
