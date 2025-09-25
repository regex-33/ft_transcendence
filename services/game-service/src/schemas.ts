const playerSchema = {
	type: 'object',
	properties: {
		userId: { type: 'integer' },
	},
};

const createGameSchema = {
	tags: ['Game'],
	body: {
		type: 'object',
		properties: {
			gameType: { $ref: 'GameType#' },
			gameMode: { $ref: 'GameMode#' },
		},
		required: ['gameType', 'gameMode'],
		additionalProperties: false,
	},
	response: {
		201: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				createdAt: { type: 'string', format: 'date-time' },
				updatedAt: { type: 'string', format: 'date-time' },
				status: { $ref: 'GameStatus#' },
				type: { $ref: 'GameType#' },
				duration: { type: 'integer' },
				winningTeam: { type: 'string' },
				tournamentId: { type: 'string' },
				mode: { $ref: 'GameMode#' },
				players: {
					type: 'array',
					items: {
						playerSchema,
					},
				},
			},
			required: ['id', 'createdAt', 'updatedAt', 'status', 'type', 'players'],
		},
		401: {
			$ref: 'Error#',
		},
		400: {
			$ref: 'Error#',
		},
	},
};

const joinGameSchema = {
	tags: ['Game'],
	body: {
		type: 'object',
		properties: {
			gameId: { type: 'string' },
		},
		required: ['gameId'],
		additionalProperties: false,
	},
	response: {
		200: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
			},
			required: ['id'],
		},
		404: {
			$ref: 'Error#',
		},
		400: {
			$ref: 'Error#',
		},
	},
};

const inviteGameSchema = {
	body: {
		type: 'object',
		required: ['gameId', 'playerId'],
		properties: {
			gameId: { type: 'string' },
			playerId: { type: 'number' },
		},
		additionalProperties: false,
	},
	response: {
		204: { type: 'null' },
		404: {
			$ref: 'Error#',
		},
		403: {
			$ref: 'Error#',
		},
	},
};

const gamePlayerSchema = {
	type: 'object',
	properties: {
		id: { type: 'integer' },
		playerId: { type: 'integer' },
		score: { type: 'integer' },
	},
};

const getGameSchema = {
	tags: ['Game'],
	params: {
		type: 'object',
		required: ['id'],
		properties: {
			id: { type: 'string' },
		},
	},
	response: {
		200: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				createdAt: { type: 'string', format: 'date-time' },
				updatedAt: { type: 'string', format: 'date-time' },
				status: { $ref: 'GameStatus#' },
				type: { $ref: 'GameType#' },
				mode: { $ref: 'GameMode#' },
				winningTeam: { type: 'string' },
				duration: { type: 'integer' },
				players: {
					type: 'array',
					items: {
						playerSchema,
					},
				},
				gamePlayers: {
					type: 'array',
					items: {
						gamePlayerSchema,
					},
				},
			},
			required: ['createdAt', 'updatedAt', 'status', 'type', 'players'],
		},
		404: {
			$ref: 'Error#',
		},
	},
};

const getPlayerGamesSchema = {
	tags: ['Game'],
	response: {
		200: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' },
					status: { $ref: 'GameStatus#' },
					type: { $ref: 'GameType#' },
					mode: { $ref: 'GameMode#' },
					winningTeam: { type: 'string' },
					tournamentId: { type: 'string' },
					duration: { type: 'number' },
					players: {
						type: 'array',
						items: {
							playerSchema,
						},
					},
				},
				required: ['createdAt', 'updatedAt', 'status', 'type', 'players'],
			},
		},
		404: {
			$ref: 'Error#',
		},
	},
};

const getPlayerIdGamesSchema = {
	params: {
		type: 'object',
		required: ['id'],
		properties: {
			id: { type: 'number' },
		},
	},
	...getPlayerGamesSchema,
};

export {
	joinGameSchema,
	getPlayerGamesSchema,
	getPlayerIdGamesSchema,
	inviteGameSchema,
	createGameSchema,
	getGameSchema,
};
