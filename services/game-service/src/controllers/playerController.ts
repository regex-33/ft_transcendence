import type { PrismaClient, Prisma } from '../../generated/prisma';

const createPlayer = async (db: PrismaClient | Prisma.TransactionClient, data: { id: number }) => {
	const player = await db.player.upsert({
		where: { userId: data.id },
		update: {},
		create: { userId: data.id },
	});
	return player;
};

const getPlayerGames = async (
	db: PrismaClient | Prisma.TransactionClient,
	data: { id: number }
) => {
	const games = await db.game.findMany({
		where: { players: { some: { userId: data.id } } },
		include: {
			players: true,
		},
	});
	console.log(games);
	return games;
};

export { createPlayer, getPlayerGames };
