import { PrismaClient, type Player, type Tournament } from '../../generated/prisma';
import { createGame, createTournamentGame } from './gameController';
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

export const getTournament = async (db: PrismaClient, tournamentId: string) =>
{
	try{
		const tournament = db.tournament.findUnique({
			where: {id: tournamentId},
			include: {
				games: true
			}
		});
		if (!tournament.games)
		{
			console.error('Tournament has no games');
			return null;
		}
		return tournament;
	}
	catch (err)
	{
		console.error("[ERROR] getTournament: ", err);
		return null;
	}
}

export type TournamentState = Tournament & { players: UserData[] };

function shuffle<T>(array: Array<T | undefined>) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
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
		const allPlayers = Array.from(this._tournaments.values()).flatMap((state) => state.players.map(p => p.id));
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
		const playerWithId = Object.assign({id: player.userId}, player);
		Object.freeze(playerWithId);
		tournamentState.players.push(playerWithId);
		if (tournamentState.players.length === tournamentState.maxPlayers) {
			this._startTournament(tournamentState);
		}
		return tournamentState;
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
		try{
		await this._db.$transaction(playersPairs.map( pair => {
			return createTournamentGame(this._db, tournamentState.id, pair);
		}));
		} catch (err)
		{
			console.error("[ERROR] start tournament: ", err);
			return null;
		}
		return await getTournament(this._db, tournamentState.id);
	}
}

export const joinTournament = async (db: PrismaClient, player: UserData) => {};
