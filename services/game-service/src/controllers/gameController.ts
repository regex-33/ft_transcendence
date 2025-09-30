import type { PrismaClient, Prisma } from '../../generated/prisma';
import { GameStatus, GameType, GameMode } from '../../generated/prisma';
import { invites } from '../gameState';
import { getOrCreatePlayer, type UserData } from './playerController';

type GameData = {
	type: GameType;
	mode: GameMode;
	player: UserData;
};

const createGame = async (db: PrismaClient | Prisma.TransactionClient, data: GameData) => {
	try {
		// const player = await getOrCreatePlayer(db, { id: data.player.id, avatar: data.player.avatar, username: data.player.username });
		//console.log('player:', player);

		const game = await db.game.create({
			data: {
				type: data.type,
				mode: data.mode,
				players: {
					connectOrCreate: {
						where: { userId: data.player.id, activeGameId: { equals: null } },
						create: {
							userId: data.player.id,
							avatar: data.player.avatar,
							username: data.player.username,
						},
					},
				},
			},
			include: { players: true },
		});
		return game;
	} catch (err) {
		console.log('error', err);
		console.log(await db.player.findUnique({ where: { userId: data.player.id } }));
		return null;
	}
};

const createTournamentGame = (
	db: PrismaClient | Prisma.TransactionClient,
	tournamentId: string,
	users: UserData[]
) => {
	return db.game.create({
		data: {
			type: GameType.SOLO,
			mode: GameMode.CLASSIC,
			tournament: {
				connect: { id: tournamentId },
			},
			players: {
				connectOrCreate: users.map((u) => ({
					where: { userId: u.id, activeGameId: { equals: null } },
					create: {
						userId: u.id,
						avatar: u.avatar,
						username: u.username,
					},
				})),
			},
		},
		include: { players: true, gamePlayers: true },
	});
};

const joinGame = async (db: PrismaClient, data: { gameId: string; player: UserData }) => {
	try {
		const gameInvitedPlayers = invites.get(data.gameId);
		if (!gameInvitedPlayers || !gameInvitedPlayers.includes(data.player.id)) {
			console.log('player is not invited 22', gameInvitedPlayers);
			return null;
		}
		const game = await db.$transaction(async (tx) => {
			const player = await getOrCreatePlayer(tx, {
				id: data.player.id,
				avatar: data.player.avatar,
				username: data.player.username,
			});
			if (!player || player.activeGameId) {
				console.log('player error:', player);
				return null;
			}
			const game = await tx.game.findFirst({
				where: {
					id: data.gameId,
				},
				include: { players: true },
			});
			if (
				!game ||
				(game.type === GameType.SOLO && game.players.length > 1) ||
				(game.type === GameType.TEAM && game.players.length > 3) ||
				game.status === GameStatus.ENDED
			) {
				console.log('game error:', game);
				return null;
			}
			const updatedGame = await tx.game.update({
				where: { id: data.gameId },
				data: {
					players: {
						connect: {
							userId: data.player.id,
						},
					},
				},
				include: { players: true },
			});
			return updatedGame;
		});
		invites.set(
			data.gameId,
			gameInvitedPlayers.filter((id) => id !== data.player.id)
		);
		return game;
	} catch (err) {
		console.log('error:', err);
		return null;
	}
};

const getGame = async (db: PrismaClient, id: string) => {
	const game = await db.game.findUnique({
		where: { id: id },
		include: {
			gamePlayers: true,
			players: true,
		},
	});
	return game;
};

const getAllGames = async (db: PrismaClient) => {
	const game = await db.game.findMany({
		include: {
			gamePlayers: true,
			players: true,
		},
	});
	return game;
};

export { createGame, getGame, joinGame, createTournamentGame };
