import type { FastifyInstance, FastifyReply } from 'fastify';
import {} from '../schemas';
import { checkAuth } from '../controllers/checkAuth';
import { getPlayerGames } from '../controllers/playerController';
import {
	createTournament,
	getAllTournaments,
	getTournament,
	tournamentManager,
} from '../controllers/tournamentController';
import { TournamentStatus } from '../../generated/prisma';

async function tournamentRoutes(fastify: FastifyInstance) {
	fastify.addHook('preHandler', checkAuth);

	fastify.get<{ Params: { tournamentId: string } }>('/:tournamentId', async (request, reply) => {
		const { tournamentId } = request.params;
		try {
			const tournament = await getTournament(fastify.prisma, tournamentId);
			if (!tournament) return reply.code(404).send({ error: 'tournament does not exist' });
			return reply.code(200).send(tournament);
		} catch (err) {
			return reply.code(404).send({ error: 'tournament does not exist' });
		}
	});

	fastify.get<{ Params: { tournamentId: string } }>(
		'/:tournamentId/updates',
		async (request, reply) => {
			const { tournamentId } = request.params;
			const user = request.user;
			reply.raw.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			});
			try {
				const tournament = await getTournament(fastify.prisma, tournamentId);
				if (!tournament) throw new Error();
				if (tournament.status === TournamentStatus.ENDED)
				{
					const data = JSON.stringify(tournament);
					reply.raw.write(`event: UPDATE\n`);
					reply.raw.write(`data: ${data}\n\n`);
					reply.raw.end();
					return ;
				}
				await tournamentManager.subscribeToUpdate(tournamentId, reply);
				if (!tournamentManager.playerHasTournament(user.id)) {
					await tournamentManager.joinTournament(tournamentId, user);
				} else {
					const tournamentState = await tournamentManager.getTournamentState(tournamentId);
					const { streams, ...state } = tournamentState!;
					const data = JSON.stringify(state);
					reply.raw.write(`event: UPDATE\n`);
					reply.raw.write(`data: ${data}\n\n`);
				}
				reply.raw.write(`data: first\n\n`);
				// }, 2000);
				request.raw.on('close', () => {
					console.log('[CLOSE] update closed by: ' + user.id);
					tournamentManager.unsubscribe(tournamentId, reply);
					// clearInterval(interval);
				});
			} catch (err) {
				const data = JSON.stringify({
					error: 'tournament does not exist.',
				});
				reply.raw.write(`event: ERROR\n`);
				reply.raw.write(`data: ${data}\n\n`);
				reply.raw.end();
			}
		}
	);

	fastify.post('/create', async (request, reply) => {
		const user = request.user;
		try {
			if (tournamentManager.playerHasTournament(user.id)) {
				return reply.code(400).send({ error: 'Player already in a tournament', });
			}
			const tournament = await createTournament(fastify.prisma, user);
			if (!tournament) return reply.code(404).send({ error: 'Failed to create tournament. tournament is null' });
			tournamentManager.addTournament(tournament);
			//tournamentManager.joinTournament(tournament.id, user);
			return reply.code(200).send(tournament);
		} catch (err) {
			if (err instanceof Error) return reply.code(403).send({ error: err.message });
			return reply.code(404).send({ error: 'Failed to create tournament. try again later' });
		}
	});

	fastify.get('/all', async (request, reply) => {
		const tournaments = await getAllTournaments(fastify.prisma);
		reply.code(200).send(tournaments);
	});

	fastify.post<{ Body: { tournamentId: string } }>('/join/', async (request, reply) => {
		const user = request.user;
		const { tournamentId } = request.body;
		try {
			const tournament = tournamentManager.joinTournament(tournamentId, user);
			if (!tournament) return reply.code(404).send({ error: 'Failed to join tournament' });
			return reply.code(200).send(tournament);
		} catch (err) {
			if (err instanceof Error) return reply.code(404).send({ error: err.message });
			return reply.code(404).send({ error: 'Failed to join tournament. try again later.' });
		}
	});
}

export default tournamentRoutes;
