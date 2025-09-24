import { h } from '../../vdom/createElement';
import { Header } from '../home/Header';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';
import Avatar1 from '../../../images/home-assests/avatar1.svg';
import bgTeam from '../../../images/game-assets/bg-team.png';
import { GameCanvas } from './GameCanvas';
import { useAuth } from '../../hooks/useAuth';

const AvatarCircle = ({ avatarImage, key }: { avatarImage: string, key: string }) => (
	<div className="relative w-6 h-6 md:w-11 md:h-11" key={key}>
		<img src="/images/home-assests/cir-offline.svg" className="absolute rounded-full shadow-[inset_0_0_0.4em_0.1em_#434146] inset-0 w-full h-full z-0" />
		<img
			src={avatarImage}
			className="w-[90%] mx-auto rounded-full object-cover z-10"
			alt={`${key}`}
		/>
	</div>
);

const TeamBadge = ({ player, reverse = false }: { player: Player | undefined, reverse: boolean }) => {
	if (!player)
		return (<div></div>);
	let nameBadge =
		<div className="uppercase flex items-center font-inria text-[0.5em] md:text-[1em] text-nowrap py-1 px-5 md:px-10 text-[#166181]" style={{
			borderImageSource: `url(${bgTeam})`,
			borderImageSlice: 60,
			borderImageWidth: "auto",
		}}>{player.name}</div>;

	return (<div className={reverse ? "flex gap-1 flex-row-reverse" : "flex gap-1"}>
		<AvatarCircle avatarImage={player.avatarImage} key={player.id} /> {nameBadge}
	</div>)
};

type Player = {
	name: string,
	id: string,
	avatarImage: string,
};


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

const TeamCard = ({ players }: { players: Player[] }) => {
	return (
		<div className="landscape:hidden md:landscape:inline-flex flex-row gap-x-2 md:flex-col h-full md:gap-y-3 px-2 py-2 md:py-4 bg-blue-200 bg-opacity-20 rounded-lg">
			{players.map(player => (
				<AvatarCircle avatarImage={player.avatarImage} key={player.id} />
			))}
		</div>
	);
}

export const GamePage: ComponentFunction = (props) => {
	const [scores, setScores] = useState([0, 0]);
	const [players, setPlayers] = useState([
		{
			name: "player1",
			id: "player1-id",
			avatarImage: Avatar1
		},
		{
			name: "player2",
			id: "player2-id",
			avatarImage: Avatar1
		}
	]);
	const [game, setGame] = useState<{ id: string, players: { userId: number }[] } | null>(null);
	const [playerId, setPlayerId] = useState<number | null>(null);
	const [loading, isAuthenticated, user] = useAuth();
	useEffect(() => {
		if (!isAuthenticated || !user)
			return;
		setPlayerId(user.id);
		getGame(props.gameId).then((data) => {
			setGame(data)
		});
	}, [isAuthenticated, user])

	useEffect(() => {
		if (!game)
			return;
		const players = game?.players.map(p => ({ id: "" + p.userId, avatarImage: Avatar1, name: "" + p.userId }));
		setPlayers(players);
	}, [game]);

	const Canvas = () =>
	{
		if(!game || !playerId)
			return (<div>no game</div>);

			return (<div>
					<div className="flex justify-between items-center">
						<TeamBadge reverse={false} player={players[0]} />
						<div className="flex">
							<span>{scores[0]}</span>
							<div>|</div>
							<span>{scores[1]}</span>
						</div>
						<TeamBadge reverse={true} player={players[1]} />
					</div>
					<div className="flex justify-center my-2 bg-[#91BFBF] shadow-xs shadow-gray-400 rounded-xl">
						<GameCanvas setScores={setScores} playerId={playerId} gameId={props.gameId} />
					</div>
			</div>)

	}

	return (
		<div
			className="relative flex flex-col overflow-hidden h-screen w-screen"
			style={{ backgroundColor: 'rgba(94, 156, 171, 0.9)' }}
		>
			<div
				className="absolute inset-0 z-0"
				style={{
					backgroundImage: 'url(/images/bg-home1.png)',
					backgroundRepeat: 'no-repeat',
					backgroundSize: '100% 100%',
				}}
			/>

			<div className="relative z-10">
				<Header />
			</div>
			<div className="z-10 flex items-center gap-10 my-10 flex-col md:flex-row md:justify-between mx-5">
				<TeamCard players={players} />
				<div className="w-[70%]">
					<Canvas />
				</div>
				<TeamCard players={players} />
			</div>
		</div>
	);
};
