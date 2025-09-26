import { PrismaClient, type Player, type Tournament } from '../../generated/prisma';
import { createPlayer } from './playerController';
import type { UserData } from './playerController';

export const createTournament = async (db: PrismaClient, data: UserData) => {
	try {
		const player = await createPlayer(db, data);
		if (player.activeGameId) return null;
		const tournament = await db.tournament.create({
			data: {},
		});
		return tournament;
	} catch (err) {
		console.error('[ERROR] createTournament: ', err);
		return null;
	}
};

export type TournamentState = Tournament & { players: number[] };

class TournamentManager {
	private _tournaments: Map<string, TournamentState>;
	private _db: PrismaClient;

	constructor(db: PrismaClient) {
		this._db = db;
		this._tournaments = new Map();
	}

	playerHasTournament(playerId: number) {
		const allPlayers = Array.from(this._tournaments.values()).flatMap((state) => state.players);
		return allPlayers.includes(playerId);
	}

	async addTournament(tournament: Tournament) {
		if (this._tournaments.has(tournament.id)) throw new Error('tournament already exists');
		this._tournaments.set(tournament.id, { ...tournament, players: [] });
	}

	async joinTournament(tournamentId: string, user: UserData) {
		const player = await createPlayer(this._db, user);
		if (player.activeGameId) throw new Error('player already in game');
		const tournamentState = this._tournaments.get(tournamentId);
		if (!tournamentState) throw new Error('tournament does not exist'); // check db ?
		if (this.playerHasTournament(user.id)) throw new Error('player already in a tournament');
		tournamentState.players.push(player.userId);
		if (tournamentState.players.length === tournamentState.maxPlayers) {
			this._startTournament(tournamentState);
		}
		return tournamentState;
	}

	private async _startTournament(tournamentState: TournamentState) {
		let playerPairs = [];
		const players = tournamentState.players;
		for (let i = 0; i < players.length; i += 2) {
			playerPairs.push(players.slice(i, i + 2));
		}
	}
}

export const joinTournament = async (db: PrismaClient, player: UserData) => {};
