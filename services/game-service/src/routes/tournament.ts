import type { FastifyInstance, FastifyReply } from 'fastify';
import { } from '../schemas';
import { checkAuth } from '../controllers/checkAuth';
import { getPlayerGames } from '../controllers/playerController';
import { createTournament, getTournament, tournamentManager } from '../controllers/tournamentController';

async function tournamentRoutes(fastify: FastifyInstance) {
	fastify.addHook('preHandler', checkAuth);

	fastify.get<{ Params: { tournamentId: string } }>('/:tournamentId', async (request, reply) => {
		const user = request.user;
		const { tournamentId } = request.params;
		try {
			const tournament = await getTournament(fastify.prisma, tournamentId);
			if (!tournament)
				return reply.code(404).send({ error: "tournament does not exist" });
			return reply.code(200).send(tournament);
		}
		catch (err) {
			return reply.code(404).send({ error: "tournament does not exist" });
		}
	});

	fastify.get<{ Params: { tournamentId: string } }>('/:tournamentId/updates', async (request, reply) => {
		const user = request.user;
		const { tournamentId } = request.params;
		reply.raw.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
		});
		try
		{
			tournamentManager.subscribeToUpdate(tournamentId, reply);
		}
		catch (err)
		{
			const data = JSON.stringify({
				error: "tournament does not exist."
			});
			reply.raw.write(`event: ERROR\n`);
			reply.raw.write(`data: ${data}\n\n`);
			reply.raw.end();
		}
		request.raw.on('close', () => {
			tournamentManager.unsubscribe(tournamentId, reply);
		});

	});

	fastify.post('/create', async (request, reply) => {
		const user = request.user;
		try {
			const tournament = await createTournament(fastify.prisma, user);
			if (!tournament)
				return reply.code(404).send({ error: "Failed to create tournament" });
			tournamentManager.addTournament(tournament);
			tournamentManager.joinTournament(tournament.id, user);
			return reply.code(200).send(tournament);
		}
		catch (err) {
			if (err instanceof Error)
				return reply.code(403).send({ error: err.message });
			return reply.code(404).send({ error: "Failed to create tournament. try again later" });
		}
	});
	
	fastify.post<{ Body: { tournamentId: string } }>('/join/', async (request, reply) => {
		const user = request.user;
		const { tournamentId } = request.body;
		try {
			const tournament = tournamentManager.joinTournament(tournamentId, user);
			if (!tournament)
				return reply.code(404).send({ error: "Failed to join tournament" });
			return reply.code(200).send(tournament);
		}
		catch (err) {
			if (err instanceof Error)
				return reply.code(404).send({ error: err.message });
			return reply.code(404).send({ error: "Failed to join tournament. try again later."});
		}
	});

	fastify.get<{ Params: { id: number } }>('/:id', { schema: {} }, async (request, reply) => {
		const { id } = request.params;
		const playerGames = await getPlayerGames(fastify.prisma, { id });
		reply.code(200).send(playerGames);
	});
}

export default tournamentRoutes;
