import { h } from "../../vdom/createElement";
import { useState } from "../../hooks/useState";
import { useRef } from "../../hooks/useRef";
import { useEffect } from "../../hooks/useEffect";
import { Game, GameConfig, GameType, GameMode } from "./game";
import { Connection } from "./connection";
import { Player } from "./GamePage";
import bgTeam from "../../../images/game-assets/bg-team.png";
import { useToast } from "./toast";

const startGame = (ctx: CanvasRenderingContext2D, game: Game, onConnect: Function): Connection => {
	ctx;
	const connection = new Connection(`${import.meta.env.VITE_WS_GAME_SERVICE_HOST}/play/${game.id}`);
	console.log("calling connect");
	connection.connect().then(() => {
		console.log("then connect");
		onConnect();
		game.start(connection);
		connection.send({
			type: "INIT",
		});
		connection.send({
			type: "FETCH_PLAYERS",
		});
		console.log("sent fetch");
	});
	return connection;
};

let handleCanvasResize = (canvasEl: HTMLCanvasElement) => {
	canvasEl.width = canvasEl.parentElement!.getBoundingClientRect().width;
	canvasEl.height = canvasEl.width * GameConfig.canvasRatio;
	console.log(canvasEl.width);
	console.log(canvasEl.height);
	console.log(canvasEl.clientWidth, canvasEl.clientHeight);
	GameConfig.onResize(canvasEl.width, canvasEl.height);
};

const initCanvas = (
	gameId: string,
	resizeHandler: () => void,
	setScores: Function
) => {
	const canvasEl = document.getElementById(
		"game-canvas"
	) as HTMLCanvasElement | null;
	if (!(canvasEl instanceof HTMLCanvasElement))
		throw new Error("canvas element not found");
	canvasEl.width = canvasEl.parentElement!.getBoundingClientRect().width;
	canvasEl.height = canvasEl.width * GameConfig.canvasRatio;
	console.log(canvasEl.width);
	console.log(canvasEl.height);
	console.log(canvasEl.clientWidth, canvasEl.clientHeight);
	GameConfig.onResize(canvasEl.width, canvasEl.height);
	const context = canvasEl.getContext("2d");
	if (!context) throw new Error("could not get canvas context");
	window.addEventListener("resize", resizeHandler);
	return context;
};

const AvatarCircle = ({
	avatarImage,
	key,
}: {
	avatarImage: string;
	key: string;
}) => (
	<div className="relative w-6 h-6 md:w-11 md:h-11" key={key}>
		<img
			src="/images/home-assests/cir-offline.svg"
			className="absolute rounded-full shadow-[inset_0_0_0.4em_0.1em_#434146] inset-0 w-full h-full z-0"
		/>
		<img
			src={avatarImage}
			className="w-[90%] mx-auto rounded-full object-cover z-10"
			alt={`${key}`}
		/>
	</div>
);

const TeamBadge = ({
	player,
	reverse = false,
}: {
	player: Player | undefined;
	reverse: boolean;
}) => {
	if (!player) return <div></div>;
	let nameBadge = (
		<div
			className="uppercase flex items-center font-inria text-[0.8em] lg:text-[1vw] text-nowrap py-1 px-5 md:px-10 text-[#166181]"
			style={{
				borderImageSource: `url(${bgTeam})`,
				borderImageSlice: 60,
				borderImageWidth: "auto",
			}}
		>
			{player.username}
		</div>
	);

	return (
		<div className={reverse ? "flex gap-1 flex-row-reverse" : "flex gap-1"}>
			<AvatarCircle avatarImage={player.avatar} key={"" + player.userId} />{" "}
			{nameBadge}
		</div>
	);
};

export const GameCanvas = (props: { playerId: number; game: any }) => {
	const [scores, setScores] = useState([0, 0]);
	const [players, setPlayers] = useState<Player[]>([]);
	const canvasRef = useRef(null);
	const [showToast, Toast] = useToast();
	// console.log("Toast", Toast);

	useEffect(() => {
		console.log("useEffect is called ref", canvasRef);
		if (!props.game?.id) return;
		console.log("gameId:", props.game.id);
		const players = props.game.players;
		setPlayers(players);
		const canvasEl = document.getElementById(
			"game-canvas"
		) as HTMLCanvasElement | null;
		if (!(canvasEl instanceof HTMLCanvasElement))
		{
			console.error("canvas element not found");
			return;
		}
		const resizeHandler = handleCanvasResize.bind(this, canvasEl);
		const context: CanvasRenderingContext2D = initCanvas(props.game.id, resizeHandler, setScores);
		const gameData = {
			id: props.game.id,
			type: GameType.SOLO,
			mode: GameMode.CLASSIC,
		};
		const connection: Connection = startGame(context, new Game(canvasEl.getContext("2d")!, gameData, setScores), () => {
			//onConnect
			console.log("onConnect called");
			showToast("Connected");
		});
		connection.onClose((e: CloseEvent) => {
			console.log('socket closed:', e.reason);
			showToast("Connection closed", "error");
		})
		return () => {
			console.log("Cleanup called");
			window.removeEventListener("resize", resizeHandler);
		};
	}, [props.game]);


	useEffect(() => {
		console.log("second useEffect called", canvasRef);
		// console.log("game", props.game);
	});
	const handleClick = () => { };
	return (
		<div>
			<div className="flex justify-center">
				{Toast}
				<div className="flex justify-between items-center">
					{
						players?.length > 1 ? (
							<div>
								<TeamBadge reverse={false} player={players[0]} />
								<div className="flex">
									<span>{scores[0]}</span>
									<div>||</div>
									<span>{scores[1]}</span>
								</div>
								<TeamBadge reverse={true} player={players[1]} />
							</div>
						) : <div className="m-auto text-gray-800 text:sm md:text-xl font-luckiest">waiting for players</div>
					}
				</div>
				<div className="flex justify-center my-2 bg-[#91BFBF] shadow-xs shadow-gray-400 rounded-xl">
					<canvas
						height="400px"
						width="800px"
						id="game-canvas"
						onClick={handleClick}
						className="rounded-lg bg-[#91BFBF] border-2 border-solid "
					></canvas>
				</div>
			</div>
		</div>
	);
};
