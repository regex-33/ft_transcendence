import type { FastifyInstance } from "fastify";
import { createGameSchema, getGameSchema, joinGameSchema } from "../schemas";
import { createGame, getGame, joinGame } from "../controllers/gameController";
//import { createPlayer } from "../controllers/playerController";
import { GameStatus, GameType, GameMode } from "../../generated/prisma";

async function gameRoutes(fastify: FastifyInstance) {
	fastify.post<{ Body: { status: GameStatus, type: GameType, mode: GameMode } }>('/create', { schema: createGameSchema }, async (request, reply) => {
		const { gameType, gameMode } = request.body as any;
		const db = fastify.prisma;
		// const player = await createPlayer(db, { id: 10 });
		const userId = 10;
		const game = await createGame(db, { type: gameType, mode: gameMode, playerId: userId });
		//notify 
		reply.code(201).send(game);
	});

	fastify.post<{ Body: { gameId: string } }>('/join', { schema: joinGameSchema }, async (request, reply) => {
		const { gameId } = request.body as any;
		let userId = 11;
		if (request.body?.userId)
			userId = request.body.userId;
		const db = fastify.prisma;
		// const player = await createPlayer(db, { id: 10 });
		const game = await joinGame(db, { gameId, userId: userId });
		if (!game)
			return reply.code(404).send({ error: "game is full or does not exist"});
		//notify game players
		reply.code(201).send(game);
	});

	// fastify.post('/delete', async (request, reply) => {
	//	return { "hello": "world" };
	// });

	fastify.get<{ Params: { id: string } }>('/:id', {
		schema: getGameSchema
	}, async (request, reply) => {
		const { id } = request.params;
		const game = await getGame(fastify.prisma, id);
		if (!game)
			return reply.code(404).send({ "error": "game not found" });
		console.log("game:", game);
		reply.code(200).send(game);
	});
}

export default gameRoutes;
