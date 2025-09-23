
type User = {
	id: number
}

interface AuthRequest extends FastifyRequest {
	user: User,
	Body: { status: GameStatus, type: GameType, mode: GameMode }
}


