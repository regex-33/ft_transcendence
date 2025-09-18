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
				mode: { $ref: 'GameMode#' },
				players: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							userId: { type: 'integer' }
						}
					}
				}
			},
			required: ['id', 'createdAt', 'updatedAt', 'status', 'type', 'players']
		}
	}
}

const joinGameSchema = {
	tags: ['Game'],
	body: {
		type: 'object',
		properties: {
			gameId: { type: 'string' },
			userId: { type: 'integer' },
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
			required: ['id']
		},
		404: {
			$ref: 'Error#'
		},
		400: {
			$ref: 'Error#'
		}
	}
}

const getGameSchema = {
	tags: ['Game'],
	params: {
		type: 'object',
		required: ['id'],
		properties: {
			id: { type: 'string' }
		}
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
				players: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							userId: { type: 'integer' }
						}
					}
				}
			},
			required: ['createdAt', 'updatedAt', 'status', 'type', 'players']
		},
		404: {
			$ref: 'Error#'
		}
	}
}

export { joinGameSchema, createGameSchema, getGameSchema }
