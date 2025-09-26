import type { FastifyInstance } from 'fastify';
import redis from '../redis';
import { checkAuth } from '../controllers/checkAuth';
import { getGame } from '../controllers/gameController';
import type { Ball, Direction, GameSession, Paddle, PlayerState } from '../gameState';
import type WebSocket from 'ws';
import { games, connections, gameConfig, initSession } from '../gameState';
import {
	GameStatus,
	GameTeam,
	GameType,
	type PrismaClient,
} from '../../generated/prisma';

// INIT: { type: init, data: gameId} response: {type: init_ack, players: [], spectator: bool }
//
//
const BALL_SPEED = 1.2;
const SPEED_BALL_SPEED = 1.8;
const MAX_SCORE = 4;
const DISCONNECT_TIMEOUT = 5000;

function isColliding(ball: Ball, paddle: Paddle) {
	const ballLeft = ball.x - gameConfig.ballRadius;
	const ballRight = ball.x + gameConfig.ballRadius;
	const ballTop = ball.y - gameConfig.ballRadius;
	const ballBottom = ball.y + gameConfig.ballRadius;

	const paddleLeft = paddle.x;
	const paddleRight = paddle.x + gameConfig.paddleWidth;
	const paddleTop = paddle.y;
	const paddleBottom = paddle.y + gameConfig.paddleHeight;
	return (
		ballRight > paddleLeft &&
		ballLeft < paddleRight &&
		ballBottom > paddleTop &&
		ballTop < paddleBottom
	);
}

function goal(players: PlayerState[], dir: Direction) {
	for (let i = 0; i < players.length; i++) {
		const player = players[i]!;
		if (player.paddle.dir !== dir) {
			player.score++;
			if (player.score === MAX_SCORE) {
				return true;
			}
		}
	}
	return false;
}

function simPong(gameSession: GameSession, dt: number) {
	const ball = gameSession.state.ball;
	const players = gameSession.state.players;
	const ballSpeed = gameSession.game.mode === 'SPEED' ? SPEED_BALL_SPEED : BALL_SPEED;
	let terminateGame = false;
	ball.x += ball.vx * ballSpeed;
	ball.y += ball.vy * ballSpeed;
	if (ball.x + gameConfig.ballRadius > gameConfig.gameWidth) {
		terminateGame = goal(players, 'RIGHT');
		ball.x = gameConfig.gameWidth / 2;
		ball.y = gameConfig.gameHeight / 2;
		ball.vx *= -1;
		ball.vy = 1;
	}
	if (ball.x - gameConfig.ballRadius < 0) {
		terminateGame = goal(players, 'LEFT');
		ball.x = gameConfig.gameWidth / 2;
		ball.y = gameConfig.gameHeight / 2;
		ball.vx *= -1;
		ball.vy = -1;
	}
	if (terminateGame) {
		gameSession.game.status = 'ENDED';
		gameSession.onEnd?.();
	}
	if (ball.y + gameConfig.ballRadius > gameConfig.gameHeight) {
		ball.y = gameConfig.gameHeight - gameConfig.ballRadius;
		ball.vy *= -1;
	}
	if (ball.y - gameConfig.ballRadius < 0) {
		ball.y = gameConfig.ballRadius;
		ball.vy *= -1;
	}
	gameSession.state.players.forEach((player) => {
		if (isColliding(ball, player.paddle)) {
			if (ball.vx > 0) ball.x = player.paddle.x - gameConfig.ballRadius;
			if (ball.vx < 0) ball.x = player.paddle.x + gameConfig.paddleWidth + gameConfig.ballRadius;
			ball.vx *= -1;
			ball.vy =
				(ball.y - (player.paddle.y + gameConfig.paddleHeight / 2)) / gameConfig.paddleHeight;
			//ball.vy *= -1;
		}
	});
}

function createGameRunner(gameSession: GameSession) {
	const state = gameSession.state;
	return function () {
		const game = gameSession.game;
		// TODO: game logic
		const now = Date.now();
		simPong(gameSession, now - state.lastTick);
		gameSession.state.lastTick = now;
		const sockets = gameSession.state.playersSockets;
		const players = gameSession.state.players;
		sockets.forEach((socket) => {
			socket.send(
				JSON.stringify({
					type: 'GAME_UPDATE',
					players: players,
					ball: gameSession.state.ball,
				})
			);
		});
	};
}

function sendPlayerUpdate(socket: WebSocket, session: GameSession) {
	//const players = session.state.players.map(({ socket, ...rest }) => rest);
	socket.send(JSON.stringify({ type: 'PLAYERS_UPDATE', players: session.state.players }));
}

function endGame(gameSession: GameSession, prismaClient: PrismaClient) {
	const game = gameSession.game;
	const now = Date.now();
	let duration;
	if (now < gameSession.startAt) duration = 0;
	else duration = now - gameSession.startAt;

	const TeamAScore = gameSession.state.players.find((p) => p.team == GameTeam.TEAM_A)?.score || 0;
	const TeamBScore = gameSession.state.players.find((p) => p.team == GameTeam.TEAM_B)?.score || 0;
	console.log('scoreA:', TeamAScore);
	console.log('scoreB:', TeamBScore);
	const winningTeam =
		TeamAScore === TeamBScore ? null : TeamAScore > TeamBScore ? GameTeam.TEAM_A : GameTeam.TEAM_B;
	prismaClient.$transaction([
		prismaClient.game.update({
			where: { id: game.id },
			data: {
				status: GameStatus.ENDED,
				duration: duration,
				winningTeam: winningTeam,
			},
		}),
		prismaClient.player.updateMany({
			where: { activeGameId: game.id },
			data: {
				points: { increment: 100 },
				activeGameId: null,
			},
		}),
		prismaClient.gamePlayer.updateMany({
			where: { gameId: game.id, team: GameTeam.TEAM_A },
			data: {
				score: TeamAScore,
			},
		}),
		prismaClient.gamePlayer.updateMany({
			where: { gameId: game.id, team: GameTeam.TEAM_B },
			data: {
				score: TeamBScore,
			},
		}),
	]);
	if (gameSession.game.tournamentId) // game is part of a tournament
	{
		//TODO: update tournament
	}
	gameSession.game.status = GameStatus.ENDED;
	games.delete(gameSession.game.id);
}
function startGame(gameSession: GameSession, prismaClient: PrismaClient) {
	// TODO: notify players about game start
	// TODO: run game loop
	const runner = createGameRunner(gameSession);
	gameSession.game.status = 'LIVE';
	const promise = prismaClient.game
		.update({
			where: { id: gameSession.game.id },
			data: {
				status: 'LIVE',
				gamePlayers: {
					createMany: {
						data: gameSession.state.players.map((p) => ({
							playerId: p.id,
							score: p.score,
							team: p.team,
						})),
					},
				},
			},
		})
		.catch((err) => {
			console.error('[ERROR]: game update failed:', err);
		});
	gameSession.runner = runner;
	gameSession.state.lastTick = Date.now();
	gameSession.intervalId = setInterval(runner, gameConfig.tick);
	gameSession.onEnd = () => {
		console.log('ENDING GAME');
		gameSession.state.playersSockets.forEach((s) => {
			s.send(JSON.stringify({
				type: 'GAME_END',
				players: gameSession.state.players
			}));
			s.close();
		});
		//gameSession.state.playersSockets.forEach((s) => s.close());
		gameSession.state.spectators.forEach((s) => s.close());
		endGame(gameSession, prismaClient);
	};
	gameSession.startAt = Date.now();
}

function gameFull(gameSession: GameSession) {
	const maxPlayers = gameSession.game.type === 'SOLO' ? 2 : 4;
	return gameSession.state.players.length === maxPlayers;
}

function createPaddle(dir: Direction): Paddle {
	return {
		x: dir === 'LEFT' ? 5 : gameConfig.gameWidth - 5 - gameConfig.paddleWidth,
		y: gameConfig.gameHeight / 2 - gameConfig.paddleHeight / 2,
		dir,
	};
}

function kickSpectator(socket: WebSocket, playerId: number) {
	socket.close(1008, 'Unauthorized');
	const session = connections.get(socket);
	if (!session) return;
	session.state.players = session.state.players.filter((p) => p.id != playerId);
}

type ActionType = 'KEY_UP' | 'KEY_DOWN';

function handlePlayerUpdate(
	socket: WebSocket,
	session: GameSession,
	playerId: number,
	action: ActionType
) {
	const players = session.state.players;
	const player = players.find((p) => p.id === playerId);
	if (!player) return kickSpectator(socket, playerId);
	if (action === 'KEY_UP') player.paddle.y -= gameConfig.paddleSpeed;
	if (action === 'KEY_DOWN') player.paddle.y += gameConfig.paddleSpeed;
	if (player.paddle.y < 0) player.paddle.y = 0;
	if (player.paddle.y + gameConfig.paddleHeight > gameConfig.gameHeight)
		player.paddle.y = gameConfig.gameHeight - gameConfig.paddleHeight;
}

const getPlayerGame = async (db: PrismaClient, playerId: number) => {
	const player = await db.player.findUnique({
		where: { userId: playerId },
		include: { activeGame: true },
	});
	if (!player) return null;
	return player.activeGame;
};

async function playRoutes(fastify: FastifyInstance) {
	fastify.addHook('preHandler', checkAuth);
	fastify.decorate('redis', redis);
	//fastify.register(fastifyWebsocket);
	fastify.get('/test', { websocket: true }, async (socket, request) => {
		console.log(socket);
	});
	fastify.get<{ Params: { gameId: string } }>(
		'/:gameId',
		{ websocket: true },
		async (socket, request) => {
			const playerId = (request as any)?.user?.id;
			if (!request.params?.gameId) {
				console.log('no param gameId');
			}
			console.log('[NEW CONNECTION] playerId:', playerId);
			// const currentGame = await getPlayerGame(fastify.prisma, playerId);
			// console.log(playerId, ' currentGame', currentGame);
			const game = await getGame(fastify.prisma, request.params.gameId);
			if (!game || game.status === GameStatus.ENDED) {
				//socket.send(JSON.stringify({ error: 'Invalid gameId' }));
				if (game) console.log('Game has ended');
				console.log('invalid game');
				socket.close(1008, 'Invalid game');
				return;
			}
			const session = initSession(game);
			connections.set(socket, session);
			const isSpec = !session.game.players.some((p) => p.userId === playerId);

			if (!isSpec) session.state.playersSockets.push(socket);
			else session.state.spectators.push(socket);
			//const onOpen = (event: WebSocket.Event) => {
			//console.log('[WEBSOCKET] player ' + playerId + ' opened connection');
			//console.log('on open:', event.type);
			//console.log('event type:', event.type);
			//};

			//socket.addEventListener('open', onOpen);
			session.state.playersSockets.forEach((s) => {
				if (s === socket) return;
				s.send(
					JSON.stringify({
						type: 'PLAYER_CONNECT',
						players: session.game.players,
						playerId: playerId,
					})
				);
			});

			socket.onclose = () => {
				console.log('[WEBSOCKET] player ' + playerId + ' closed connection');
				connections.delete(socket);
				session.state.spectators = session.state.spectators.filter((s) => s !== socket);
				session.state.playersSockets = session.state.playersSockets.filter((s) => {
					if (s === socket) return false;
					s.send(
						JSON.stringify({
							type: 'PLAYER_DISCONNECT',
							players: session.state.players,
							playerId: playerId,
							timeout: DISCONNECT_TIMEOUT,
						})
					);
					return true;
				});
				setTimeout(() => {
					console.log("[timeout] sstart");
					if (session.game.status !== GameStatus.ENDED && session.state.playersSockets.length === 0) {
						if (session.intervalId) clearInterval(session.intervalId);
						session.runner = null;
						console.log('[TIMEOUT] Clearing game', session.game.id);
						endGame(session, fastify.prisma);
						session.state.players = session.state.players.filter((p) => p.id !== playerId);
					}
				}, DISCONNECT_TIMEOUT);
				// Delete all game ??? and set winner ??
				socket.removeAllListeners();
			};

			socket.onmessage = async (messageEvent: WebSocket.MessageEvent) => {
				try {
					const raw = messageEvent.data.toString();
					const data = await JSON.parse(raw);
					const session = connections.get(socket);
					if (!session) throw new Error('Session not added to map');
					//console.log('session:', session);
					//const isSpec = !(playerId in session.state.players);
					//console.log('isSpec:', isSpec);
					if (isSpec) {
						console.log('New Spectator:', playerId);
						socket.close(1008, 'Unauthorized');
						return;
					}
					console.log('[RECV] data:', data);
					if (data.type == 'INIT') {
						const paddleDir: Direction =
							session.state.players.filter((p) => p.paddle.dir === 'LEFT').length % 2
								? 'RIGHT'
								: 'LEFT';
						const playerTeam = paddleDir === 'LEFT' ? GameTeam.TEAM_A : GameTeam.TEAM_B;
						const playerState: PlayerState = {
							id: playerId,
							score: 0,
							paddle: createPaddle(paddleDir),
							team: playerTeam,
						};
						if (session.state.players.find((p) => p.id === playerId) !== undefined)
							console.log('already initialized');
						else session.state.players.push(playerState);
						// console.log(session.state);
						const connectedPlayers = session.state.players.map((p) => p.id);
						console.log('connectedPlayers:', connectedPlayers);
						console.log('games:', games.size);
						console.log('connections:', connections.size);
						if (!session.runner && gameFull(session)) {
							console.log('game is full');
							startGame(session, fastify.prisma);
						}
					} else if (data.type === 'UPDATE') {
						console.log('UPDATE RECEIVED');
						handlePlayerUpdate(socket, session, playerId, data.action);
					} else if (data.type === 'FETCH_PLAYERS') {
						console.log('PLAYERS UPDATE!');
						sendPlayerUpdate(socket, session);
					}
				} catch (err) {
					console.log('invalid socket message from player ' + playerId);
					console.log('error: ', err);
					socket.close(1008, 'Invalid message');
				}
			};
		}
	);

	fastify.get('/health', {}, async (request, reply) => {
		try {
			// const ping = await redis.ping();
			// reply.code(200).send({
			// 	status: 'ok',
			// 	redis: {
			// 		ping,
			// 	},
			// });
		} catch (err) {
			reply.code(200).send({
				status: 'error',
				redis: {
					err,
				},
			});
		}
	});
}

export default playRoutes;
