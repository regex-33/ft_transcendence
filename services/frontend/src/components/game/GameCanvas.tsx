import { h } from "../../vdom/createElement";
import { useState } from "../../hooks/useState";
import { useRef } from "../../hooks/useRef";
import { useEffect } from "../../hooks/useEffect";
import { Game, GameConfig, GameType, GameMode, LocalGame, RemoteGame } from "./game";
import { Connection } from "./connection";
import { Player } from "./GamePage";
import bgTeam from "../../../images/game-assets/bg-team.png";
import ScoreSepImg from '../../../images/game-assets/score-separator.png';
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


const initCanvas = (
	canvasEl: HTMLCanvasElement,
	resizeHandler: () => void,
) => {
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

export const GameCanvas = (props: { local: boolean; playerId: number; game: any }) => {
	const [scores, setScores] = useState([0, 0]);
	const [players, setPlayers] = useState<Player[]>([]);
	const [started, setStarted] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	// const [connection, setConnection] = useState<Connection | null>(null);
	const connectionRef = useRef<Connection | null>(null);
	const [showToast, Toast] = useToast();

	const handleCanvasResize = () => {
		const canvasEl = canvasRef.current;
		if (!canvasEl) return;
		//const ratio = window.devicePixelRatio || 1;
		const ratio = 1;
		console.log('ratio', ratio);
		canvasEl.width = canvasEl.parentElement!.getBoundingClientRect().width * ratio;
		canvasEl.height = canvasEl.width * GameConfig.canvasRatio * ratio;
		canvasEl.getContext("2d")?.scale(ratio, ratio)
		canvasEl.style.width = canvasEl.width / ratio + 'px';
		canvasEl.style.height = canvasEl.height / ratio + 'px';

		console.log(canvasEl.width);
		console.log(canvasEl.height);
		console.log(canvasEl.clientWidth, canvasEl.clientHeight);
		GameConfig.onResize(canvasEl.width, canvasEl.height);
	};

	useEffect(() => {
		if (props.local) {
			setPlayers([{ username: 'Player 1', userId: 0, avatar: '/images/default-avatar.png', score: 0 },
			{ username: 'Player 2', userId: 1, avatar: '/images/default-avatar.png', score: 0 }]);
			return;
		}
		if (!props.game?.id) return;
		console.log("gameId:", props.game.id);
		const players = props.game.players;
		setPlayers(players);
		const connection = connectionRef.current;
		if (!connection) {
			const conn = new Connection(`${import.meta.env.VITE_WS_GAME_SERVICE_HOST}/play/${props.game.id}`);
			connectionRef.current = conn;
			return () => {
				console.log("close conn on unmount:", conn);
				conn.close();
			}
		}
		return () => {
			console.log("close connection on unmount:", connection);
			connection.close();
		}
	}, [props.game]);

	const handleStartGame = () => {
		if (!canvasRef.current) return;
		if (props.local) {
			const context = initCanvas(canvasRef.current, handleCanvasResize);
			const gameData = {
				id: props.game.id,
				type: GameType.SOLO,
				mode: GameMode.CLASSIC,
			};
			const game = new LocalGame(context, gameData, setScores, setPlayers);
			game.start();
			setStarted(true);
			return;
		}
		const connection = connectionRef.current;
		if (!connection) return;
		setStarted(true);
		connectionRef.current?.send({
			type: "INIT",
		});
	}

	useEffect(() => {
		if (!canvasRef.current) return;

		const context = initCanvas(canvasRef.current, handleCanvasResize);
		if (props.local) return;
		const connection = connectionRef.current;
		if (!connection) return;
		connection.connect().then(() => {
			console.log("then connect");
			const gameData = {
				id: props.game.id,
				type: GameType.SOLO,
				mode: GameMode.CLASSIC,
			};
			const game = new RemoteGame(context, gameData, setScores, setPlayers);
			game.start(connection);
			connection.send({
				type: "FETCH_PLAYERS",
			});
			console.log("sent fetch");
		}).catch(err => {
			console.log("connect error:", err);
			connection.close();
		});
		connection.onClose((e: CloseEvent) => {
			console.log('socket closed:', e.reason);
			showToast("Connection closed", "error");
		})
		return () => {
			console.log("Cleanup called");
			window.removeEventListener("resize", handleCanvasResize);
		};
	}, [canvasRef, connectionRef])

	const handleClick = () => { };
	return (
		<div>
			<div className="flex flex-col justify-center">
				{Toast}
				{
					players?.length > 1 ? (
						<div className="flex justify-between items-center">
							<TeamBadge reverse={false} player={players[0]} />
							<div className="flex gap-2 items-center">
								<span className="text-white text-lg font-luckiest">
									{scores[0]}
								</span>
								<img src={ScoreSepImg} className="mb-2 max-w-[30px]" />
								<span className="text-white text-lg font-luckiest">
									{scores[1]}
								</span>
							</div>
							<TeamBadge reverse={true} player={players[1]} />
						</div>
					) : <div className="m-auto text-center text-gray-800 text:sm md:text-xl font-luckiest">waiting for players</div>
				}
				<div className="px-3 py-1 rounded-3xl bg-[#91BFBF]">
					<div className="relative flex justify-center my-2 bg-white p-4 shadow-xs shadow-gray-400 rounded-xl">
						<div className="w-full flex justify-center">
							<canvas
								ref={canvasRef}
								height="400px"
								width="800px"
								id="game-canvas"
								onClick={handleClick}
								className="bg-[#91BFBF]"
							></canvas>
						</div>
						{(players?.length === 2 && !started) && <button onClick={handleStartGame} className="absolute flex gap-4 align-center border-2 top-[50%] translate-y-[-50%] text-lg rounded-lg shadow-sm bg-teal-400 hover:bg-teal-300 px-8 py-2 font-poppins font-bold text-white">
							<i class="fa-solid text-lg fa-table-tennis-paddle-ball"></i>
							<div>start</div>
						</button>
						}
					</div></div>
			</div>
		</div>
	);
};
