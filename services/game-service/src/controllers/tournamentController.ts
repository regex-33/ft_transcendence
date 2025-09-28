import type { FastifyReply } from 'fastify';
import { Prisma, PrismaClient, TournamentStatus } from '../../generated/prisma';
import { prismaClient } from '../client-plugin';
import { createTournamentGame } from './gameController';
import { createPlayer } from './playerController';
import type { UserData } from './playerController';

export const createTournament = async (db: PrismaClient, data: UserData) => {
	try {
		const player = await createPlayer(db, data);
		if (player.activeGameId) {
			console.log("[ERROR]: player has a game", player.activeGameId);
			return null;
		}
		const tournament = await db.tournament.create({
			data: {},
			include: {
				games: { include: { players: true } },
			},
		});
		if (!tournament) console.log("tournament is NULL");
		console.log("tournament is:", tournament);
		return tournament;
	} catch (err) {
		console.log('[ERROR] createTournament: ', err);
		return null;
	}
};

export const getAllTournaments = async (db: PrismaClient) => {
	try {
		const tournaments = await db.tournament.findMany({ include: { games: { include: { players: true } } } });
		return tournaments;
	} catch (err) {
		console.error('[ERROR] get all tournaments: ', err);
	}
	return null;
};

export const getTournament = async (db: PrismaClient, tournamentId: string) => {
	try {
		const tournament = db.tournament.findUnique({
			where: { id: tournamentId },
			include: {
				games: {
					include: {players:true, gamePlayers: { include: { player: true } } }
				},
			},
		});
		if (!tournament.games) {
			console.error('Tournament has no games');
			return null;
		}
		return tournament;
	} catch (err) {
		console.error('[ERROR] getTournament: ', err);
		return null;
	}
};

export type TournamentWithGames = Prisma.TournamentGetPayload<{ include: { games: { include: { players: true } } } }>;

export type GameWithPlayers = Prisma.GameGetPayload<{
	include: { gamePlayers: { include: { player: true } } };
}>;

export type TournamentState = TournamentWithGames & {
	players: UserData[];
	streams: FastifyReply[];

	endedGames: GameWithPlayers[];
};

function shuffle<T>(array: Array<T | undefined>) {
	let currentIndex = array.length;
	while (currentIndex != 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
}

class TournamentManager {
	private _tournaments: Map<string, TournamentState>;
	private _db: PrismaClient;

	constructor(db: PrismaClient) {
		this._db = db;
		this._tournaments = new Map();
	}

	playerHasTournament(playerId: number) {
		const allPlayers = Array.from(this._tournaments.values()).flatMap((state) =>
			state.players.map((p) => p.id)
		);
		return allPlayers.includes(playerId);
	}

	async getTournamentState(tournamentId: string) {
		const tournamentState = this._tournaments.get(tournamentId);
		if (tournamentState) return tournamentState;
		const tournament = await getTournament(this._db, tournamentId);
		if (!tournament || tournament.status === TournamentStatus.ENDED) return null;
		this._tournaments.set(tournament.id, {
			...tournament,
			endedGames: [],
			players: [],
			streams: [],
		});
		return this._tournaments.get(tournament.id)!;
	}

	async addTournament(tournament: TournamentWithGames) {
		if (this._tournaments.has(tournament.id)) throw new Error('tournament already exists');
		this._tournaments.set(tournament.id, {
			...tournament,
			endedGames: [],
			players: [],
			streams: [],
		});
	}

	async joinTournament(tournamentId: string, user: UserData) {
		const tournamentState = await this.getTournamentState(tournamentId);
		if (!tournamentState) throw new Error('tournament does not exist'); // check db ?
		if (tournamentState.players.length >= tournamentState.maxPlayers)
			throw new Error('Tournament full');
		const player = await createPlayer(this._db, user);
		if (player.activeGameId) throw new Error('player already in game');
		if (this.playerHasTournament(user.id)) throw new Error('player already in a tournament');
		const playerWithId = Object.assign({ id: player.userId }, player);
		Object.freeze(playerWithId);

		tournamentState.players.push(playerWithId);
		if (tournamentState.players.length === tournamentState.maxPlayers) {
			this._startTournament(tournamentState);
		} else this.publish(tournamentState.id);
		return tournamentState;
	}

	private async _endTournament(tournamentId: string, lastGame: GameWithPlayers | null) {
		const winnerId =
			lastGame?.gamePlayers.find((gp) => gp.team === lastGame.winningTeam)?.player.userId ?? null;
		console.log('[END TOURNAMENT]: ', tournamentId, 'winner:', winnerId);
		try {
			await this._db.tournament.update({
				where: { id: tournamentId },
				data: {
					status: TournamentStatus.ENDED,
					winnerId: winnerId,
				},
			});
			this._tournaments.delete(tournamentId);
		}
		catch (err) {
			console.log('[END TOURNAMENT ERROR:', err);
		}
	}
	private async getPlayerTournament(playerId: number)
	{
		// const tournamentState = this._tournaments.values().find(tournamentState => tournamentState.players.find());
		// return tournamentState ?? null;
	}

	private async _nextBracket(tournamentState: TournamentState) {
		const winners: UserData[] = [];
		tournamentState.endedGames.forEach((game) => {
			const winner = game.gamePlayers.find((p) => p.team === game.winningTeam);
			if (!winner) return;
			const { userId, ...w } = winner.player;
			winners.push({ ...w, id: userId });
		});
		console.log('[WINNERS] length === ', winners.length);
		console.log('[WINNERS] winners:', winners);
		if (winners.length < 2) {
			this._endTournament(
				tournamentState.id,
				tournamentState.endedGames.find((game) => game.winningTeam !== null) ?? null
			);
			return;
		}
		const game = await createTournamentGame(this._db, tournamentState.id, winners);
		tournamentState.games.push(game);
	}

	public async onGameEnd(game: GameWithPlayers) {
		if (!game.tournamentId) {
			throw new Error('UNEXPECTED: Game has no tournamentId')
		};
		const tournamentId = game.tournamentId;
		const tournamentState = this._tournaments.get(tournamentId);
		if (!tournamentState) {
			console.log('UNEXPECTED: Game has no tournamentState')
			return;
		}
		tournamentState.endedGames.push(game);
		const oldGame = tournamentState.games.find(g => g.id === game.id);
		if (!oldGame)
			throw new Error('UNEXPECTED: Game has no state')
		oldGame.status = game.status;
		oldGame.players = game.gamePlayers.map(gp => gp.player);

		if (tournamentState.endedGames.length === 2) {
			this._nextBracket(tournamentState);
		}
		// last game
		else if (tournamentState.endedGames.length === 3) {
			console.log(' ====> [END TOURNAMENT]')
			this._endTournament(tournamentId, game);
		}
	}

	private async _startTournament(tournamentState: TournamentState) {
		const players = tournamentState.players;
		if (players.length !== tournamentState.maxPlayers)
			throw new Error('not enough players for tournament');
		shuffle(players);
		let playersPairs = [];
		for (let i = 0; i < players.length; i += 2) {
			playersPairs.push(players.slice(i, i + 2));
		}
		try {
			await this._db.$transaction(
				playersPairs.map((pair) => {
					return createTournamentGame(this._db, tournamentState.id, pair);
				})
			);
		} catch (err) {
			console.error('[ERROR] start tournament: ', err);
			return null;
		}
		const tournament = await getTournament(this._db, tournamentState.id);
		if (!tournament) return null;
		tournamentState.games = tournament.games;
		this.publish(tournamentState.id, 'START');
		return tournament;
	}

	public async subscribeToUpdate(tournamentId: string, stream: FastifyReply) {
		const tournamentState = await this.getTournamentState(tournamentId);
		if (!tournamentState) throw new Error('tournament does not exist'); // check db ?
		tournamentState.streams.push(stream);
	}

	public async unsubscribe(tournamentId: string, stream: FastifyReply) {
		const tournamentState = await this.getTournamentState(tournamentId);
		if (!tournamentState) return;
		tournamentState.streams = tournamentState.streams.filter((s) => s !== stream);
	}

	private async publish(tournamentId: string, event = 'UPDATE') {
		const tournamentState = await this.getTournamentState(tournamentId);
		if (!tournamentState) return;
		const { streams, ...state } = tournamentState;
		tournamentState.streams.forEach((stream) => {
			const data = JSON.stringify(state);
			stream.raw.write(`event: ${event}\n`);
			stream.raw.write(`data: ${data}\n\n`);
		});
	}
}

export const tournamentManager = new TournamentManager(prismaClient);