import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { useRef } from '../../hooks/useRef';
import { useEffect } from '../../hooks/useEffect';

export const GameCanvas = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	useEffect(() => {
		console.log("called canvas useeffect");
		console.log("ref is", canvasRef.current);
		const canvasEl = document.getElementById("game-canvas") as HTMLCanvasElement | null;
		if (!(canvasEl instanceof HTMLCanvasElement))
			throw new Error("canvas element not found");
		const context = canvasEl.getContext("2d");
		if (!context)
			throw new Error("could not get canvas context");
	}, []);
	const handleClick = () => {
		console.log("ref is", canvasRef.current);
	};
	//return h("canvas", { class: "w-full rounded-lg  border-[0.9em] border-white-300 p-4 bg-[#91BFBF]", ref: canvasRef }, null);
	return (
		<canvas ref={canvasRef} id="game-canvas" onClick={handleClick} className="w-full rounded-lg  border-[0.9em] border-white-300 p-4 bg-[#91BFBF]"></canvas>
	);
};
