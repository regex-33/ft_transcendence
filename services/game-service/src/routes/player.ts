import type { FastifyInstance, FastifyReply } from 'fastify';
import { getPlayerIdGamesSchema } from '../schemas';
import { checkAuth } from '../controllers/checkAuth';
import { getOrCreatePlayer, getPlayerGames, getPlayerStats } from '../controllers/playerController';
import type { PrismaClient } from '../../generated/prisma';

async function playerRoutes(fastify: FastifyInstance) {
	fastify.addHook('preHandler', checkAuth);

	fastify.get('/games', async (request, reply) => {
		const user = (request as any).user;
		const playerGames = await getPlayerGames(fastify.prisma, { id: user.id });
		reply.code(200).send(playerGames);
	});

	fastify.get('/game-history', async (request, reply) => {
		const user = (request as any).user;
		try {
			const db: PrismaClient = fastify.prisma;
			const history = await db.game.findMany({
				where: { gamePlayers: {some: {playerId: user.id}}},
				include: {
					gamePlayers: { include: {player: true}}
				},
				orderBy: [{updatedAt: 'desc'}],
				take: 5
			});
			if (!history) return reply.code(400).send({ error: 'could not fetch player history' });
			reply.code(200).send(
				history
			);
		} catch (err) {
			reply.code(404).send({ error: 'could not fetch player history' });
		}
	});
	
	fastify.get('/leaderboard', async (request, reply) => {
		const user = (request as any).user;
		try {
			const db: PrismaClient = fastify.prisma;
			const players = await db.player.findMany({
				orderBy: [{wins: 'desc'}],
				take: 5
			});
			const me = await getOrCreatePlayer(db, user);
			if (!me) return reply.code(400).send({ error: 'could not fetch player history' });
			if (!players) return reply.code(400).send({ error: 'could not fetch player history' });
			if (!players.find(player => player.userId === me.userId))
			{
				return reply.code(200).send([...players.slice(0, 4), me])
			}
			return reply.code(200).send(players)
		} catch (err) {
			reply.code(404).send({ error: 'could not fetch player history' });
		}
	});

	fastify.get('/overview', async (request, reply) => {
		const user = (request as any).user;
		try {
			const db: PrismaClient = fastify.prisma;
			const overview = await db.player.findUnique({
				where: { userId: user.id },
				include: {
					games: {
						orderBy: [
							{game: {
								duration: 'desc',
							}},
							{score: 'desc'}
						],
						include: { game: {
							include: {gamePlayers: {
								include: {player: {
									select: {
										avatar: true,
										username: true,
										userId: true
									}
								}}
							}}
						} },
						take: 3
					},
				},
			});
			if (!overview) return reply.code(400).send({ error: 'could not fetch player overview' });
			const rank = await db.player.count({
				where: {
					wins: {gt: overview.wins}
				}
			})
			if (rank === null) return reply.code(400).send({ error: 'could not fetch player overview rank' });

			const highlightedGames = overview.games.map(gp => gp.game);
			reply.code(200).send({
				highlightedGames,
				points: overview.points,
				matchesWon: overview.wins,
				matchesLost: overview.losses,
				rank: rank + 1
			});
		} catch (err) {
			reply.code(404).send({ error: 'could not fetch player overview'});
		}
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
		const player = await getOrCreatePlayer(fastify.prisma, user);
		if (!player) reply.code(404).send({ error: 'failed to fetch player' });
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
