import type { PrismaClient } from "../../generated/prisma";
import type { GameStatus, GameType } from "../../generated/prisma";

type GameData =
	{
		status: GameStatus,
		type: GameType,
		playerId: number
	}

const createGame = async (db: PrismaClient, data: GameData) => {
	const game = await db.game.create({
		data: {
			status: data.status,
			type: data.type,
			players:
			{
				connect: { userId: data.playerId }
			}
		},
		include: { players: true }
	});
	return game;
}

const getGame = async (db: PrismaClient, id: number) => {
	const game = await db.game.findUnique({
		where: {id: id}
	});
	return game;
}

export { createGame, getGame }
