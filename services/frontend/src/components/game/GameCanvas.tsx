import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { useRef } from '../../hooks/useRef';
import { useEffect } from '../../hooks/useEffect';
import { Game, paddleOptions, Paddle, Ball, leftPaddleOptions, rightPaddleOptions, GameConfig, GameType, GameMode } from './game';
import { Connection } from './connection';

const startGame = (ctx: CanvasRenderingContext2D, game: Game) => {
	ctx;
	game.start();
}

const initCanvas = async (gameId: string) => {
	const canvasEl = document.getElementById("game-canvas") as HTMLCanvasElement | null;
	if (!(canvasEl instanceof HTMLCanvasElement))
		throw new Error("canvas element not found");
	const connection = new Connection('ws://localhost:9000/play/' + gameId)
	await connection.connect();
	connection.connect().then(() => {
		console.log("then connect");
	});

	canvasEl.width = canvasEl.parentElement!.getBoundingClientRect().width;
	GameConfig.onResize(canvasEl.width, canvasEl.height);
	const context = canvasEl.getContext("2d");
	if (!context)
		throw new Error("could not get canvas context");
	const handleCanvasResize = () => {
		canvasEl.width = canvasEl.parentElement!.getBoundingClientRect().width;
		GameConfig.onResize(canvasEl.width, canvasEl.height);
	};
	window.addEventListener('resize', handleCanvasResize);
	const gameData = {
		id: "",
		type: GameType.SOLO,
		mode: GameMode.CLASSIC
	};
	startGame(context, new Game(canvasEl.getContext("2d")!, gameData));
	return () => {
		console.log("canvas unmounted");
		window.removeEventListener('resize', handleCanvasResize);
	}
}

const getGame = async (gameId: string) => {
	try {
		const response = await fetch("http://localhost/api/game/" + gameId, {
			method: "GET",
			credentials: 'include',
		});
		if (!response.ok)
			return null;
		const data = await response.json();
		console.log(data);
		return data;
	}
	catch (err) {
		console.error("getGame", err);
	}
	return null;
}

export const GameCanvas = (props: { playerId: number, gameId: string }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [game, setGame] = useState(null);
	useEffect(() => {
		console.log("gameId:", props.gameId);
		console.log("ref is", canvasRef.current);
		getGame(props.gameId).then((data) => {
			setGame(data)
		});
		return initCanvas();
	}, [canvasRef]);
	const handleClick = () => {
		console.log("ref is", canvasRef.current);
	};
	return (
		<canvas ref={canvasRef} height="500px" width="800px" id="game-canvas" onClick={handleClick}
			className="rounded-lg bg-[#91BFBF] border-2 border-solid "></canvas>
	);
};
