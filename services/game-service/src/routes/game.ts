import type { FastifyInstance, FastifyReply } from 'fastify';
import { createGameSchema, getGameSchema, inviteGameSchema, joinGameSchema } from '../schemas';
import { createGame, getGame, joinGame } from '../controllers/gameController';
import { checkAuth } from '../controllers/checkAuth';
import { games, invites } from '../gameState';

async function gameRoutes(fastify: FastifyInstance) {
	fastify.addHook('preHandler', checkAuth);

	// Creates a game
	fastify.post<AuthRequest>(
		'/create',
		{ schema: createGameSchema },
		async (request, reply: FastifyReply) => {
			const user = (request as any).user;
			console.log('user:', user);
			const { gameType, gameMode } = request.body as any;
			const db = fastify.prisma;
			// const player = await createPlayer(db, { id: 10 });
			const userId = user.id;
			const game = await createGame(db, {
				type: gameType,
				mode: gameMode,
				player: user
			});
			if (!game) return reply.code(401).send({ error: 'Player already has an active game' });
			const gameId = game.id;
			const gameInvites = invites.get(gameId);
			if (!gameInvites) invites.set(gameId, [user.id]);
			else gameInvites.push(user.id);
			console.log('game created');
			//notify
			reply.code(201).send(game);
		}
	);

	// Invites player to a game
	fastify.post<{ Body: { gameId: string; playerId: number } }>(
		'/invite',
		{ schema: inviteGameSchema },
		async (request, reply) => {
			const user = (request as any).user;
			const { gameId, playerId } = request.body;
			if (user.id === playerId) return reply.code(403).send({ error: 'cannot invite this player' });
			const game = await getGame(fastify.prisma, gameId);
			if (!game) return reply.code(404).send({ error: 'game not found' });
			console.log('userId:', user.id);
			console.log('game players:', game.players);
			if (!game.players.some((p) => p.userId === user.id))
				return reply.code(403).send({ error: 'cannot invite to this game' }); // Keep same message ??
			let gameInvites = invites.get(gameId);
			if (!gameInvites) invites.set(gameId, [playerId]);
			else {
				if (gameInvites.includes(playerId))
					return reply.code(403).send({
						error: 'player is already invited to this game',
					}); // Keep same message ??
				gameInvites.push(playerId);
			}
			console.log('invited players:', invites.get(gameId));
			return reply.code(204).send();
		}
	);

	fastify.post<{ Body: { gameId: string } }>(
		'/join',
		{ schema: joinGameSchema },
		async (request, reply) => {
			const user = (request as any).user;
			const { gameId } = request.body;
			const db = fastify.prisma;
			// const player = await createPlayer(db, { id: 10 });
			const game = await joinGame(db, { gameId, player: user });
			if (!game) return reply.code(404).send({ error: 'game is full or does not exist' });
			const gameSession = games.get(gameId);
			if (gameSession)
				gameSession.game = game;
			//notify game players
			reply.code(201).send(game);
		}
	);

	// fastify.post('/delete', async (request, reply) => {
	//	return { "hello": "world" };
	// });

	fastify.get<{ Params: { id: string } }>(
		'/:id',
		{
			schema: getGameSchema,
		},
		async (request, reply) => {
			const { id } = request.params;
			const game = await getGame(fastify.prisma, id);
			fastify.log.info('game get');
			if (!game) return reply.code(404).send({ error: 'game not found' });
			console.log('game:', game);
			reply.code(200).send(game);
		}
	);
}

export default gameRoutes;
