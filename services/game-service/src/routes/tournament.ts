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
				if (tournament.status === TournamentStatus.ENDED) {
					const data = JSON.stringify(tournament);
					reply.raw.write(`event: UPDATE\n`);
					reply.raw.write(`data: ${data}\n\n`);
					reply.raw.end();
					return;
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
					//console.log('[CLOSE] update closed by: ' + user.id);
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
				const tournamentState = tournamentManager.getPlayerTournament(user.id);
				if (!tournamentState)
					return reply.code(404).send({ error: 'Failed to create tournament. try again later' });
				return reply.code(200).send({id: tournamentState.id});
			}
			const tournament = await createTournament(fastify.prisma, user);
			if (!tournament)
				return reply.code(404).send({ error: 'Failed to create tournament. tournament is null' });
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

	fastify.post<{ Body: { tournamentId: string; playerId: number } }>(
		'/invite',
		async (request, reply) => {
			const sessionId = request.cookies?.session_id;
			const token = request.cookies?.token;
			if (!sessionId || !token)
				return reply.code(401).send({ error: 'Unauthorized: session not found' });
			const user = request.user;
			const { tournamentId, playerId } = request.body;
			//console.log('tournamentID:', tournamentId);
			if (user.id === playerId) return reply.code(403).send({ error: 'cannot invite this player' });
			try {
				const cookies = 'session_id=' + sessionId + ';token=' + token;
				const response = await fetch('http://user-service:8001/api/notifications/create', {
					method: 'POST',
					headers: {
						Cookie: cookies,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						gameId: tournamentId,
						userId: playerId,
						type: 'TOURNAMENT_NOTIFICATION',
					}),
				});
				if (!response.ok) {
					const text = await response.text();
					//console.log('fetch err:', response.status, text);
					return reply.code(403).send({ error: 'Could not invite player to this tournament' });
				}
				return reply.code(204).send();
			} catch (err) {
				if (err instanceof Error) return reply.code(404).send({ error: err.message });
				return reply.code(404).send({ error: 'Failed to invite player. try again later.' });
			}
		}
	);
	
	fastify.post<{ Body: { gameId: string } }>(
		'/remove-notification/',
		async (request, reply) => {
			const sessionId = request.cookies.session_id!;
			const token = request.cookies.token!;
			const user = (request as any).user;
			const { gameId } = request.body;
			const cookies = 'session_id=' + sessionId + ';token=' + token;
			//console.log('gameId:', gameId)
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
}

export default tournamentRoutes;
