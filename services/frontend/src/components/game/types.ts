export interface GameAction {
	action_type: "INIT" | "MOVE_UP" | "MOVE_DOWN",
	gameId: string,
	playerId: string,
}

export type Message = {
	type: "error" | "update";
	message: string;
	playerId: number;
} | {
	type: "action";
	action: GameAction;
}

export type UpdateMessage = Extract<Message, { type: "error" | "update" }>;
