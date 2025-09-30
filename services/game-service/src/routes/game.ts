import type { FastifyInstance, FastifyReply } from 'fastify';
import { createGameSchema, getGameSchema, inviteGameSchema, joinGameSchema } from '../schemas';
import { createGame, getGame, joinGame } from '../controllers/gameController';
import { checkAuth } from '../controllers/checkAuth';
import { games, invites } from '../gameState';
import { GameMode, GameStatus, type PrismaClient } from '../../generated/prisma';
import { getOrCreatePlayer } from '../controllers/playerController';

const MODE_POINTS = {
	[GameMode.CLASSIC]: 150,
	[GameMode.SPEED]: 300,
	[GameMode.VANISH]: 550,
	[GameMode.GOLD]: 1000,
};

async function gameRoutes(fastify: FastifyInstance) {
	fastify.addHook('preHandler', checkAuth);

	// Creates a game
	fastify.post<AuthRequest>(
		'/create',
		{ schema: createGameSchema },
		async (request, reply: FastifyReply) => {
			const user = (request as any).user;
			const { gameType, gameMode } = request.body as any;
			const db = fastify.prisma;
			let player = await getOrCreatePlayer(db, user);
			const modePoints = MODE_POINTS[gameMode as GameMode];
			if (player.points < modePoints)
				return reply.code(401).send({ error: 'not enough points for this game mode' });
			if (player.activeGameId !== null) {
				if (player?.activeGame?.status === GameStatus.ENDED) {
					player = await db.player.update({
						where: { userId: user.id },
						data: {
							activeGameId: null,
						},
					});
				}
				else
					return reply.code(401).send({ error: 'Player already has an active game' });
			}
			const game = await createGame(db, {
				type: gameType,
				mode: gameMode,
				player: user,
			});
			if (!game)
				return reply.code(401).send({ error: 'Could not create game, retry again later.' });
			const gameId = game.id;
			const gameInvites = invites.get(gameId);
			if (!gameInvites) invites.set(gameId, [user.id]);
			else gameInvites.push(user.id);
			//console.log('game created');
			//notify
			reply.code(201).send(game);
		}
	);

	// Invites player to a game
	fastify.post<{ Body: { gameId: string; playerId: number } }>(
		'/invite',
		{ schema: inviteGameSchema },
		async (request, reply) => {
			const sessionId = request.cookies?.session_id;
			const token = request.cookies?.token;
			if (!sessionId || !token)
				return reply.code(401).send({ error: 'Unauthorized: session not found' });
			const user = (request as any).user;
			const { gameId, playerId } = request.body;
			if (user.id === playerId) return reply.code(403).send({ error: 'cannot invite this player' });
			const game = await getGame(fastify.prisma, gameId);
			if (!game) return reply.code(404).send({ error: 'game not found' });
			//console.log('userId:', user.id);
			//console.log('game players:', game.players);
			if (!game.players.some((p) => p.userId === user.id))
				return reply.code(403).send({ error: 'cannot invite to this game' }); // Keep same message ??
			const cookies = 'session_id=' + sessionId + ';token=' + token;
			let gameInvites = invites.get(gameId);
			if (!gameInvites) {
				gameInvites = [];
				invites.set(gameId, gameInvites);
			}
			if (gameInvites.includes(playerId))
			{
				fetch('http://user-service:8001/api/notifications/' + gameId, {
					method: 'DELETE',
					headers: {
						Cookie: cookies,
					},
				});
				return reply.code(403).send({
					error: 'player is already invited to this game',
				}); // Keep same message ??
			}
			const response = await fetch('http://user-service:8001/api/notifications/create', {
				method: 'POST',
				headers: {
					Cookie: cookies,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					gameId: gameId,
					userId: playerId,
					type: 'MATCH_NOTIFICATION',
				}),
			});
			if (!response.ok) {
				const text = await response.text();
				//console.log('fetch err:', response.status, text);
				return reply.code(403).send({ error: 'Could not invite player to this game' });
			}
			gameInvites.push(playerId);
			//console.log('game invites:', invites.get(gameId));
			//console.log('invited players:', invites.get(gameId));
			return reply.code(204).send();
		}
	);
	fastify.post<{ Body: { gameId: string } }>(
		'/invite/decline',
		//{ schema: DeclineGameSchema },
		async (request, reply) => {
			const sessionId = request.cookies.session_id!;
			const token = request.cookies.token!;
			const user = (request as any).user;
			const playerId = user.id;
			const { gameId } = request.body;
			let gameInvites = invites.get(gameId);
			if (gameInvites)
				invites.set(
					gameId,
					gameInvites.filter((id) => id !== playerId)
				);
			const cookies = 'session_id=' + sessionId + ';token=' + token;
			const response = await fetch('http://user-service:8001/api/notifications/' + gameId, {
				method: 'DELETE',
				headers: {
					Cookie: cookies,
				},
			});
			if (!response.ok) {
				const text = await response.text();
				//console.log('fetch err:', response.status, text);
				return reply.code(403).send({ error: 'Something went wrong! try again later.' });
			}
			reply.code(204).send();
		}
	);

	fastify.post<{ Body: { gameId: string } }>(
		'/join',
		{ schema: joinGameSchema },
		async (request, reply) => {
			const sessionId = request.cookies.session_id!;
			const token = request.cookies.token!;
			const user = (request as any).user;
			const { gameId } = request.body;
			const db = fastify.prisma;
			// const player = await getOrCreatePlayer(db, { id: 10 });
			const cookies = 'session_id=' + sessionId + ';token=' + token;
			fetch('http://user-service:8001/api/notifications/' + gameId, {
				method: 'DELETE',
				headers: {
					Cookie: cookies,
				},
			});
			const game = await joinGame(db, { gameId, player: user });
			if (!game) return reply.code(404).send({ error: 'game is full or does not exist' });
			const gameSession = games.get(gameId);
			if (gameSession) gameSession.game = game;
			//notify game players
			reply.code(201).send(game);
		}
	);

	fastify.get('/recent', async (request, reply) => {
		const user = request.user;
		const db: PrismaClient = fastify.prisma;
		try {
			const games = await db.game.findMany({
				where: { status: { not: { equals: GameStatus.WAITING } } },
				include: { gamePlayers: { include: { player: true } } },
				orderBy: [{ updatedAt: 'desc' }, { status: 'desc' }],
				take: 5,
			});
			if (!games) return reply.code(400).send({ error: 'could not fetch recent games' });
			reply.code(200).send(games);
		} catch (err) {
			reply.code(404).send({ error: 'could not fetch recent games' });
		}
	});

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
			reply.code(200).send(game);
		}
	);
}

export default gameRoutes;
