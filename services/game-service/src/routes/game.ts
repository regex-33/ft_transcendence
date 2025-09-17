import type { FastifyInstance } from "fastify";
import { createGameSchema, getGameSchema } from "../schemas";
import { createGame, getGame } from "../controllers/gameController";
//import { createPlayer } from "../controllers/playerController";
import { GameStatus, GameType } from "../../generated/prisma";

async function gameRoutes(fastify: FastifyInstance) {
	fastify.post<{ Body: { status: GameStatus, type: GameType } }>('/create', { schema: createGameSchema }, async (request, reply) => {
		const { gameStatus, gameType } = request.body as any;
		const db = fastify.prisma;
		// const player = await createPlayer(db, { id: 10 });
		const userId = 10;
		const game = await createGame(db, { status: gameStatus, type: gameType, playerId: userId });
		reply.code(201).send(game);
	});

	// fastify.post('/delete', async (request, reply) => {
	//	return { "hello": "world" };
	// });

	fastify.get<{ Params: { id: number } }>('/:id', {
		schema: getGameSchema
	}, async (request, reply) => {
		const { id } = request.params;
		const game = getGame(fastify.prisma, id);
		if (!game)
			return reply.code(404).send({ "error": "game not found" });
		reply.code(200).send(game);
	});
}

export default gameRoutes;
