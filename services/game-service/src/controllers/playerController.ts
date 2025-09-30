import { type PrismaClient, type Prisma, GameStatus } from '../../generated/prisma';

export type UserData = {
	id: number;
	avatar: string;
	username: string;
};

export const getOrCreatePlayer = async (
	db: PrismaClient | Prisma.TransactionClient,
	data: UserData
) => {
	const player = await db.player.upsert({
		where: { userId: data.id },
		update: {},
		create: { userId: data.id, avatar: data.avatar, username: data.username },
		include: { activeGame: true },
	});
	return player;
};

export interface PlayerStats {
	rank: number;
	wins: number;
	losses: number;
	points: number;
}

const getPlayerStats = async (db: PrismaClient | Prisma.TransactionClient, playerId: number) => {
	const playerGames = await db.player.findUnique({
		where: { userId: playerId },
		include: {
			games: {
				include: {
					game: true,
				},
			},
		},
	});

	const games = await db.gamePlayer.findMany({
		where: { playerId: playerId },
	});
	console.log('playergames', games);
	console.log(playerGames);

	if (!playerGames) return null;
	return playerGames;
};

const getPlayerGames = async (
	db: PrismaClient | Prisma.TransactionClient,
	data: { id: number }
) => {
	const games = await db.game.findMany({
		where: { players: { some: { userId: data.id } } },
		select: {
			duration: true,
			id: true,
			status: true,
			mode: true,
			type: true,
			winningTeam: true,
			gamePlayers: {
				select: {
					player: {
						select: {
							avatar: true,
							username: true,
							userId: true,
						},
					},
					team: true,
					score: true,
				},
			},
		},
	});
	// const games = games.map(game => {

	// }
	// );
	console.log(games);
	return games;
};

export { getPlayerGames, getPlayerStats };
