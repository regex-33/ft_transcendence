const createGameSchema = {
	tags: ['Game'],
	body: {
		type: 'object',
		properties: {
			gameStatus: { $ref: 'GameStatus#' },
			gameType: { $ref: 'GameType#' }
		},
		additionalProperties: false
	},
	response: {
		201: {
			type: 'object',
			properties: {
				id: { type: 'integer' },
				createdAt: { type: 'string', format: 'date-time' },
				updatedAt: { type: 'string', format: 'date-time' },
				status: { $ref: 'GameStatus#' },
				type: { $ref: 'GameType#' },
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

export { createGameSchema }
