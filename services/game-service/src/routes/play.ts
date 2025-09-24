import type { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import redis from '../redis';
import { checkAuth } from '../controllers/checkAuth';
import { getGame } from '../controllers/gameController';
import type { Ball, GameMetadata, GameSession, Paddle, PlayerState } from '../gameState';
import type WebSocket from 'ws';
import { games, connections, gameConfig, initSession } from '../gameState';
import type { PrismaClient } from '../../generated/prisma';

// INIT: { type: init, data: gameId} response: {type: init_ack, players: [], spectator: bool }
//
//
const BALL_SPEED = 1.2;
//const PADDLE_SPEED = 10;

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

function simPong(gameSession: GameSession, dt: number) {
	const ball = gameSession.state.ball;
	const players = gameSession.state.players;
	ball.x += ball.vx * BALL_SPEED;
	ball.y += ball.vy * BALL_SPEED;
	if (ball.x > gameConfig.gameWidth) {
		ball.x = gameConfig.gameWidth;
		ball.vx *= -1;
	}
	if (ball.x < 0) {
		ball.x = 0;
		ball.vx *= -1;
	}
	if (ball.y > gameConfig.gameHeight) {
		ball.y = gameConfig.gameHeight;
		ball.vy *= -1;
	}
	if (ball.y < 0) {
		ball.y = 0;
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

function startGame(gameSession: GameSession) {
	// TODO: notify players about game start
	// TODO: run game loop
	const runner = createGameRunner(gameSession);
	gameSession.runner = runner;
	gameSession.state.lastTick = Date.now();
	gameSession.intervalId = setInterval(runner, gameConfig.tick);
}

function gameFull(gameSession: GameSession) {
	const maxPlayers = gameSession.game.type === 'SOLO' ? 2 : 4;
	return gameSession.state.players.length === maxPlayers;
}

function createPaddle(dir: 'LEFT' | 'RIGHT'): Paddle {
	return {
		x: dir === 'LEFT' ? 5 : gameConfig.gameWidth - 5 - gameConfig.paddleWidth,
		y: gameConfig.gameHeight / 2 - gameConfig.paddleHeight / 2,
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
			console.log('playerId is:', playerId);
			if (!request.params?.gameId) {
				console.log('no param gameId');
			}
			const currentGame = await getPlayerGame(fastify.prisma, playerId);
			console.log(playerId, ' currentGame', currentGame);
			const game = await getGame(fastify.prisma, request.params.gameId);
			if (!game) {
				//socket.send(JSON.stringify({ error: 'Invalid gameId' }));
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

			socket.onclose = () => {
				console.log('[WEBSOCKET] player ' + playerId + ' closed connection');
				connections.delete(socket);
				session.state.players = session.state.players.filter((p) => p.id !== playerId);
				session.state.spectators = session.state.spectators.filter((s) => s !== socket);
				session.state.playersSockets = session.state.playersSockets.filter((s) => s !== socket);
				if (session.intervalId) clearInterval(session.intervalId);
				// Delete all game ??? and set winner ??
				socket.removeAllListeners();
			};

			socket.onmessage = async (messageEvent) => {
				try {
					const raw = messageEvent.data.toString();
					const data = await JSON.parse(raw);
					const session = connections.get(socket);
					if (!session) throw new Error('Session not added to map');
					//console.log('session:', session);
					//const isSpec = !(playerId in session.state.players);
					//console.log('isSpec:', isSpec);
					if (isSpec) {
						console.log('spec msg');
						socket.close(1008, 'Unauthorized');
						return;
					}
					console.log('data:', data);
					if (data.type == 'INIT') {
						const playerState: PlayerState = {
							id: playerId,
							score: 0,
							paddle: createPaddle(session.state.players.length === 0 ? 'LEFT' : 'RIGHT'),
						};
						if (session.state.players.find((p) => p.id === playerId))
							console.log('already initialized');
						else session.state.players.push(playerState);
						console.log(session.state);
						console.log('games:', games.size);
						console.log('connections:', connections.size);
						if (gameFull(session)) {
							console.log('game is full');
							startGame(session);
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
			const ping = await redis.ping();
			reply.code(200).send({
				status: 'ok',
				redis: {
					ping,
				},
			});
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
