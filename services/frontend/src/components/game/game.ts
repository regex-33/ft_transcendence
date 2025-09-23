import { Connection } from "./connection";
import { UpdateMessage } from "./types";

export class GameConfig {
	static canvasWidth = 0;
	static canvasHeight = 0;
	static paddleWidth = 0;
	static paddlePercent = 3;
	static readonly paddleRatio = 15 / 3;
	static upKeys = new Set(['arrowLeft', 'arrowUp', 'W', 'w', 'a', 'A']);
	static downKeys = new Set(['arrowRight', 'arrowDown', 'd', 'D', 's', 'S']);

	static onResize(width: number, height: number) {
		GameConfig.canvasWidth = width;
		GameConfig.canvasHeight = height;
		GameConfig.paddleWidth = width * GameConfig.paddlePercent / 100;
	}
}

export const leftPaddleOptions: paddleOptions = {
	color: "#F9A346",
	dir: "left"
}

export const rightPaddleOptions: paddleOptions = {
	color: "#497E87",
	dir: "right"
}

export type paddleOptions = {
	color: string,
	dir: "left" | "right"
}

export class Paddle {
	x: number
	y: number
	options: paddleOptions
	constructor(x: number, y: number, opt: paddleOptions) {
		this.x = x;
		this.y = y;
		this.options = opt;

	}
	draw = (ctx: CanvasRenderingContext2D) => {
		const paddle = this;
		const width = GameConfig.paddleWidth;
		const height = width * GameConfig.paddleRatio;
		console.log("paddle width:", width);
		const radius = width * 1 / 2;

		const { x, y, options } = paddle;
		ctx.beginPath();

		if (options.dir === "right") {
			ctx.moveTo(x, y);
			ctx.lineTo(x + width - radius, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
			ctx.lineTo(x + width, y + height - radius);
			ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
			ctx.lineTo(x, y + height);
		}
		else {
			ctx.moveTo(x + width, y);
			ctx.lineTo(x + radius, y);
			ctx.quadraticCurveTo(x, y, x, y + radius);
			ctx.lineTo(x, y + height - radius);
			ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
			ctx.lineTo(x + width, y + height);
		}
		ctx.closePath();
		ctx.fillStyle = options.color;
		ctx.fill();
	}
}

export type Ball = {
	x: number,
	y: number,
	color: string
}

export enum GameType {
	SOLO = "SOLO",
	TEAM = "TEAM"
};

export enum GameMode {
	CLASSIC = "CLASSIC",
	SPEED = "SPEED"
};


const drawBall = (ctx: CanvasRenderingContext2D, ball: Ball) => {
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, 4, 0, 2 * Math.PI);
	ctx.strokeStyle = ball.color;
	ctx.stroke();
}

export class Game {
	paddles: Paddle[];
	ball: Ball = {
		x: 0, y: 0, color: 'red'
	};
	type: GameType;
	mode: GameMode;
	id: string;
	ctx: CanvasRenderingContext2D;
	_connection: Connection;
	private _activeKeys: Set<string>

	constructor(ctx: CanvasRenderingContext2D, { id, type, mode }: { id: string, type: GameType, mode: GameMode }) {
		this._activeKeys = new Set();
		this.ctx = ctx;
		this.id = id;
		const p1 = new Paddle(10, GameConfig.canvasHeight / 2, leftPaddleOptions);
		const p2 = new Paddle(GameConfig.canvasWidth - GameConfig.paddleWidth - 10, GameConfig.canvasHeight / 2, rightPaddleOptions);
		this.paddles = [p1, p2];
		this._connection = new Connection("ws://localhost:9000/play/efpep");
		this.type = type;
		this.mode = mode;
	}

	async _initConnection() {
		await this._connection.connect();
		const gameId = this.id;
		const playerId = 10 // TODO use id;
		this._connection.send({ type: "action", action_type: "INIT", gameId, playerId });
		const updateMsg: UpdateMessage = await this._connection.once("update");
		if (!updateMsg.message.includes('initialized'))
			throw new Error("unexpected message");
		this._connection.initialized = true;
	}

	draw = () => {
		this.ctx.clearRect(0, 0, GameConfig.canvasWidth, GameConfig.canvasHeight);
		this.paddles.forEach((paddle) => {
			paddle.draw(this.ctx);
		})
		drawBall(this.ctx, this.ball);
	}

	private _onKeyDown = (e: KeyboardEvent) => {
		let keys;
		if (GameConfig.downKeys.has(e.key))
			keys = GameConfig.downKeys;
		else if (GameConfig.upKeys.has(e.key))
			keys = GameConfig.upKeys;
		else
			return;
		for (const key in this._activeKeys) {
			if (keys.has(key))
				return;
		}
		this._activeKeys.add(e.key);
	}

	private _onKeyUp = (e: KeyboardEvent) => {
		this._activeKeys.delete(e.key);
	}

	start = () => {
		console.log(this.paddles);
		window.addEventListener("keydown", this._onKeyDown);
		window.addEventListener("keyup", this._onKeyUp);
		requestAnimationFrame(this._renderFrame);
	}

	private _sendEvent = (key: string) => {
		console.log("send eent:", key);
		const p1 = this.paddles[0];
		if (GameConfig.upKeys.has(key))
			p1.y -= 10;
		else if (GameConfig.downKeys.has(key))
			p1.y += 10;
		console.log("key:", key);
	}

	private _renderFrame = () => {
		for (const key of this._activeKeys)
			this._sendEvent(key);
		this.draw();
		requestAnimationFrame(this._renderFrame);
	}
}
