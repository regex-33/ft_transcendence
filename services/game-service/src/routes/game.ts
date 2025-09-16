import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { createGameSchema } from "../schemas";
import { createGame } from "../controllers/gameController";
import { createPlayer } from "../controllers/playerController";

async function gameRoutes(fastify: FastifyInstance, opts: FastifyPluginOptions) {
	opts;
	fastify.post('/create', { schema: createGameSchema }, async (request, reply) => {
		const { gameStatus, gameType } = request.body as any;
		const db = fastify.prisma;
		const player = await createPlayer(db, { id: 10 });
		const game = await createGame(db, { status: gameStatus, type: gameType, playerId: player.userId });
		reply.code(201).send(game);
	});

	fastify.post('/delete', async (request, reply) => {
		return { "hello": "world" };
	});

	fastify.get('/:id', {
		schema: {

			params: {
				type: 'object',
				required: ['id'],
				properties: {
					id: { type: 'number' }
				}
			},
		}
	}, async (request, reply) => {
		const { id } = request.params as { id: Number };
		try {
			const gameId = Number(id);
		}
		catch (err) {
			return { "error": "bad request" }
		}
		return { "hello": "world new" };
	});
}

export default gameRoutes;
