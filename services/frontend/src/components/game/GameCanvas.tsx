import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { useRef } from '../../hooks/useRef';
import { useEffect } from '../../hooks/useEffect';
import { Game, paddleOptions, Paddle, Ball, leftPaddleOptions, rightPaddleOptions, GameConfig, GameType, GameMode } from './game';
import { Connection } from './connection';

const startGame = (ctx: CanvasRenderingContext2D, game: Game) => {
	ctx;
	const connection = new Connection('ws://localhost:9000/play/' + game.id)
	connection.connect().then(() => {
		console.log("then connect");
		game.start(connection);
		connection.send({
			type: 'INIT'
		});
		connection.send({
			type: 'FETCH_PLAYERS'
		});
		console.log("sent fetch");
	});
}

let handleCanvasResize = (canvasEl: HTMLCanvasElement) => {
	canvasEl.width = canvasEl.parentElement!.getBoundingClientRect().width;
	canvasEl.height = canvasEl.width * GameConfig.canvasRatio;
	console.log(canvasEl.width)
	console.log(canvasEl.height)
	console.log(canvasEl.clientWidth, canvasEl.clientHeight);
	GameConfig.onResize(canvasEl.width, canvasEl.height);
};

const initCanvas = async (gameId: string, resizeHandler: () => void, setScores: Function) => {
	const canvasEl = document.getElementById("game-canvas") as HTMLCanvasElement | null;
	if (!(canvasEl instanceof HTMLCanvasElement))
		throw new Error("canvas element not found");
	canvasEl.width = canvasEl.parentElement!.getBoundingClientRect().width;
	canvasEl.height = canvasEl.width * GameConfig.canvasRatio;
	console.log(canvasEl.width)
	console.log(canvasEl.height)
	console.log(canvasEl.clientWidth, canvasEl.clientHeight);
	GameConfig.onResize(canvasEl.width, canvasEl.height);
	const context = canvasEl.getContext("2d");
	if (!context)
		throw new Error("could not get canvas context");
	window.addEventListener('resize', resizeHandler);
	const gameData = {
		id: gameId,
		type: GameType.SOLO,
		mode: GameMode.CLASSIC
	};
	startGame(context, new Game(canvasEl.getContext("2d")!, gameData, setScores));
}


export const GameCanvas = (props: { setScores: Function, playerId: number, gameId: string }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	useEffect(() => {
		if (!props.gameId)
			return;
		console.log("gameId:", props.gameId);
		console.log("ref is", canvasRef.current);
		const canvasEl = document.getElementById("game-canvas") as HTMLCanvasElement | null;
		if (!(canvasEl instanceof HTMLCanvasElement))
			throw new Error("canvas element not found");
		const resizeHandler = handleCanvasResize.bind(this, canvasEl);
		initCanvas(props.gameId, resizeHandler, props.setScores);
		return () => {
			console.log("canvas unmounted");
			window.removeEventListener('resize', resizeHandler);
		}
	}, [props.gameId]);
	const handleClick = () => {
		console.log("ref is", canvasRef.current);
	};
	return (
		<canvas ref={canvasRef} height="500px" width="800px" id="game-canvas" onClick={handleClick}
			className="rounded-lg bg-[#91BFBF] border-2 border-solid "></canvas>
	);
};
