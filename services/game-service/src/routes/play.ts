import type { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import redis from '../redis';
import { checkAuth } from '../controllers/checkAuth';
import { getGame } from '../controllers/gameController';
import type { GameMetadata, GameSession, Paddle, PlayerState } from '../gameState';
import type WebSocket from 'ws';
import { games, connections, gameConfig, initSession } from '../gameState';
import type { PrismaClient } from '../../generated/prisma';

// INIT: { type: init, data: gameId} response: {type: init_ack, players: [], spectator: bool }

function createGameRunner(gameSession: GameSession) {
	return function () {
		const game = gameSession.game;
		// TODO: game logic
	};
}

function startGame() {
	// TODO: notify players about game start
	// TODO: run game loop
}

function gameFull(gameSession: GameSession) {
	const maxPlayers = gameSession.game.type === 'SOLO' ? 2 : 4;
	return gameSession.state.players.length === maxPlayers;
}

function createPaddle(): Paddle {
	return {
		x: gameConfig.gameWidth - 20,
		y: gameConfig.gameHeight / 2,
	};
}

function kickSpectator(socket: WebSocket, playerId: number) {
	socket.close(1008, 'Unauthorized');
	const session = connections.get(socket);
	if (!session) return;
	session.state.players = session.state.players.filter((p) => p.id != playerId);
}

function handlePlayerUpdate(socket: WebSocket, session: GameSession, playerId: number) {
	const players = session.state.players;
	const player = players.find((p) => p.id === playerId);
	if (!player) return kickSpectator(socket, playerId);
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
	//fastify.addHook('preHandler', checkAuth);
	fastify.decorate('redis', redis);
	//fastify.register(fastifyWebsocket);
	fastify.get('/test', { websocket: true }, async (socket, request) => {
		console.log(socket);
	});
	fastify.get<{ Params: { gameId: string } }>('/', { websocket: true }, async (socket, request) => {
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
			socket.close(1008, 'Invalid game');
			return;
		}
		const session = initSession(game);
		connections.set(socket, session);

		const onOpen = (event: WebSocket.Event) => {
			console.log('[WEBSOCKET] player ' + playerId + ' opened connection');
			console.log('on open:', event.type);
			console.log('event type:', event.type);
		};

		socket.addEventListener('open', onOpen);

		socket.onclose = () => {
			console.log('[WEBSOCKET] player ' + playerId + ' closed connection');
			socket.removeAllListeners();
		};

		socket.onmessage = (messageEvent) => {
			try {
				const raw = messageEvent.data.toString();
				const data = JSON.parse(raw);
				const session = connections.get(socket);
				if (!session) throw new Error('Session not added to map');
				const isSpec = !(playerId in session.state.players);
				if (isSpec) {
					socket.close(1008, 'Unauthorized');
					return;
				}
				if (data.type === 'INIT') {
					const playerState: PlayerState = {
						id: playerId,
						score: 0,
						paddle: createPaddle(),
						socket: socket,
					};
					session.state.players.push(playerState);
					session.game.players;
					if (gameFull(session)) startGame();
				} else if (data.type === 'UPDATE') {
					handlePlayerUpdate(socket, session, playerId);
				}
			} catch (err) {
				fastify.log.info('invalid socket message from player ' + playerId);
				socket.close(1008, 'Invalid message');
			}
		};
	});

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
