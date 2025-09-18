import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { useRef } from '../../hooks/useRef';
import { useEffect } from '../../hooks/useEffect';

class GameConfig {
	static canvasWidth = 0;
	static canvasHeight = 0;
	static paddleWidth = 0;
	static paddlePercent = 3;
	static readonly paddleRatio = 15 / 3;

	static onResize(width: number, height: number) {
		GameConfig.canvasWidth = width;
		GameConfig.canvasHeight = height;
		GameConfig.paddleWidth = width * GameConfig.paddlePercent / 100;
	}
}


type paddleOptions = {
	color: string,
	dir: "left" | "right"
}

const leftPaddleOptions: paddleOptions = {
	color: "#F9A346",
	dir: "left"
}

const rightPaddleOptions: paddleOptions = {
	color: "#497E87",
	dir: "right"
}

type Paddle = {
	x: number,
	y: number,
	options: paddleOptions,
}

class Game {
	paddles: Paddle[];
	constructor(gameId: string) {
		console.log("game id:", gameId);
		this.paddles = [];
	}
}

//const drawPaddle = (ctx: CanvasRenderingContext2D, x: number, y: number, options: paddleOptions) => {
const drawPaddle = (ctx: CanvasRenderingContext2D, paddle: Paddle) => {
	const width = GameConfig.paddleWidth;
	const height = width * GameConfig.paddleRatio;
	console.log("paddle width:", width);
	const radius = width * 1 / 2;

	const { x, y, options } = paddle;
	ctx.beginPath();

	if (options.dir === "left") {
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

const startGame = (ctx: CanvasRenderingContext2D, game: Game) => {
	drawPaddle(ctx, { x: 10, y: 10, options: rightPaddleOptions });
	drawPaddle(ctx, { x: 10, y: 100, options: leftPaddleOptions });
}

export const GameCanvas = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	useEffect(() => {
		console.log("called canvas useeffect");
		console.log("ref is", canvasRef.current);
		const canvasEl = document.getElementById("game-canvas") as HTMLCanvasElement | null;
		if (!(canvasEl instanceof HTMLCanvasElement))
			throw new Error("canvas element not found");
		GameConfig.onResize(canvasEl.width, canvasEl.height);
		const context = canvasEl.getContext("2d");
		if (!context)
			throw new Error("could not get canvas context");
		const handleCanvasResize = (e: Event) => {
			GameConfig.onResize(canvasEl.width, canvasEl.height);
		};
		canvasEl.addEventListener('resize', handleCanvasResize);
		startGame(context, new Game(""));
		return () => {
			console.log("canvas unmounted");
			canvasEl.removeEventListener('resize', handleCanvasResize);
		}
	}, []);
	const handleClick = () => {
		console.log("ref is", canvasRef.current);
	};
	//return h("canvas", { class: "w-full rounded-lg  border-[0.9em] border-white-300 p-4 bg-[#91BFBF]", ref: canvasRef }, null);
	return (
		<canvas ref={canvasRef} id="game-canvas" onClick={handleClick} className="w-full rounded-lg  border-[0.2em] md:border-[0.9em] border-white-300 p-1 md:p-4 bg-[#91BFBF]"></canvas>
	);
};
