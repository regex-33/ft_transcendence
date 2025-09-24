import type { PrismaClient, Prisma } from '../../generated/prisma';

export type UserData = {
	id: number;
	avatar: string;
	username: string;
}

const createPlayer = async (db: PrismaClient | Prisma.TransactionClient, data: UserData) => {
	const player = await db.player.upsert({
		where: { userId: data.id },
		update: {},
		create: { userId: data.id, avatar: data.avatar, username: data.username },
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
