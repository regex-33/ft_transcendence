import type { PrismaClient } from "../../generated/prisma";
import { GameStatus, GameType, GameMode } from "../../generated/prisma";
import { createPlayer } from "./playerController";

type GameData =
	{
		type: GameType,
		mode: GameMode,
		playerId: number
	}

const createGame = async (db: PrismaClient, data: GameData) => {
	const game = await db.game.create({
		data: {
			type: data.type,
			mode: data.mode,
			players:
			{
				connectOrCreate: {
					where: { userId: data.playerId },
					create: { userId: data.playerId }
				}
			}
		},
		include: { players: true }
	});
	return game;
}

const joinGame = async (db: PrismaClient, data: { gameId: string, userId: number }) => {
	try
	{
		const game = await db.$transaction(async (tx) =>
		{
			const player = await createPlayer(tx, {id: data.userId });
			if (!player || player.gameId)
			{
				console.log("player error:", player);
				return null;
			}
			const game = await tx.game.findFirst({
				where: {
					id: data.gameId,
				},
				include: { players: true }
			});
			if (!game || (game.type === GameType.SOLO && game.players.length > 1) || (game.type === GameType.TEAM && game.players.length > 3))
			{
				console.log("game error:", game);
				return null;
			}
			const updatedGame = await tx.game.update({
				where: {id: data.gameId},
				data:
				{
					players:
					{
						connect: {
							userId: data.userId
						}
					}
				}
			})
			return updatedGame;
		});
		return game;
	}
	catch (err)
	{
		return null;
	}
}

const getGame = async (db: PrismaClient, id: string) => {
	const game = await db.game.findUnique({
		where: {id: id},
		include:
		{
			players: true
		}
	});
	return game;
}

export { createGame, getGame, joinGame }
