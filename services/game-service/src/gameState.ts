import type { GameTeam, Prisma } from '../generated/prisma';
import type WebSocket from 'ws';

export interface Paddle {
	x: number;
	y: number;
	dir: Direction;
}

export type GameMetadata = Prisma.GameGetPayload<{ include: { players: true } }>;

export type Direction = 'LEFT' | 'RIGHT';

export interface Ball {
	x: number;
	y: number;
	vx: number;
	vy: number;
}

export interface PlayerState {
	id: number;
	score: number;
	team: GameTeam;
	paddle: Paddle;
	//	socket: WebSocket;
}

export interface GameState {
	players: PlayerState[];
	spectators: WebSocket[];
	playersSockets: WebSocket[];
	ball: Ball;
	lastTick: number;
}

export interface GameSession {
	game: GameMetadata;
	state: GameState;
	startAt: number;
	runner?: (() => void) | null;
	intervalId?: NodeJS.Timeout;
	onEnd?: Function;
}

export function initSession(game: GameMetadata) {
	let session = games.get(game.id);
	if (!session) {
		const state = {
			ball: { x: gameConfig.gameWidth / 2, y: gameConfig.gameHeight / 2, vx: 1, vy: 1 },
			players: [],
			spectators: [],
			playersSockets: [],
			lastTick: -1,
		};
		session = {
			game,
			state,
			startAt: Date.now(),
			runner: null
		};
		games.set(game.id, session);
	}
	return session;
}

// Key: gameId
const invites: Map<string, number[]> = new Map();

const connections: Map<WebSocket, GameSession> = new Map();
const games: Map<string, GameSession> = new Map();

const FPS = 60;
const tick = 1000 / FPS;
const gameWidth = 200;
const ratio = 1 / 2;
const paddleWidth = (gameWidth * 3) / 100;
const paddleRatio = 15 / 3;
const paddleHeight = paddleWidth * paddleRatio;
const ballRadius = 2;
const paddleSpeed = 2;

const gameHeight = gameWidth * ratio;
const gameConfig = {
	FPS,
	tick,
	gameWidth,
	ratio,
	gameHeight,
	paddleWidth,
	paddleHeight,
	ballRadius,
	paddleSpeed,
};

export { connections, games, gameConfig, invites };
