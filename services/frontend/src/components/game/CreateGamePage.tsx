import { h } from '../../vdom/createElement';
import { Header } from '../home/Header';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';
import BadgeBg from '../../../images/game-badge-bg.png';
import GameRemoteImg from '../../../images/game-remote.png';
import GameLocalImg from '../../../images/game-local.png';
import GameTournamentImg from '../../../images/game-tournament.png';
import TournamentButtonImg from '../../../images/tournament-button.svg';
import Avatar1 from '../../../images/home-assests/avatar1.svg';
import { TeamCard } from './TeamCard';
import { useAuth } from '../../hooks/useAuth';
import { GameMode, GameType } from './game';
import { createNewGame, redirectToActiveGame } from './utils';

const Toast = (props: { con: string, show: boolean, type: string }) => {
	let bgColor: string;
	switch (props.type) {
		case "primary":
			bgColor = "bg-blue-400";
			break;
		case "error":
			bgColor = "bg-red-400";
			break;
		default:
			bgColor = "bg-blue-400";
			break;
	}
	return (
		<div
			class={(props.show ? "fixed" : "hidden") + " z-[99999] bottom-10 left-1/2 transform -translate-x-1/2 " + bgColor + " text-white px-6 py-3 rounded shadow-lg translate-y-4 pointer-events-none"}
		>{props.con}
		</div>);
}

const Badge = (props: { text: string }) => {
	return (
		<div className="flex justify-center items-center object-fit leading-none">
			<img src={BadgeBg} className="block max-w-[200px]" />
			<span className="absolute text-white font-luckiest">{props.text}</span>
		</div>
	)
}
const CardContainer = (props: any) => {
	return (
		<div className="bg-[#58D7DFAD]/70 flex flex-col justify-center py-20 my-2 px-10 rounded-2xl border-white-100 border-2">
			{props.children}
		</div>
	);
}

const CardButton = (props: { onClick?: CallableFunction }) => {
	return (
		<button onClick={props.onClick}>
			<div className="pointer flex my-3 font-luckiest flex-row justify-center items-center">
				<div className="bg-white pt-4 pb-3 px-8 text-[#5FDBE3] text-xs">One</div>
				<div className="bg-[#5FDBE3] px-4 pt-5 pb-4 text-2xl text-white">VS</div>
				<div className="bg-white pt-4 pb-3 px-8 text-[#5FDBE3] text-xs">One</div>
			</div>
		</button>
	)
}


export const CreateGamePage: ComponentFunction = () => {
	const [loading, isAuthenticated, user] = useAuth();

	const [toast, setToast] = useState({
		show: false,
		content: "",
		type: 'primary'
	});
	useEffect(() => {
		if (!user)
			return;
		redirectToActiveGame();
	}, [user])

	useEffect(() => {

	}, [user]);

	const showToast = (content: string, type = 'primary') => {
		setToast({
			show: true,
			content: content,
			type
		});
		setTimeout(() => {
			setToast({ show: false, content: "", type });
		}, 2000);
	}

	const handleClickRemote = async (type: GameType, e: Event) => {
		console.log(e);
		console.log(type);
		const game = await createNewGame(type);
		if (!game)
			return showToast("Failed to create game!", "error");
		showToast("[!] Game created successfully: " + game.id);
		setTimeout(() => {
			window.history.pushState({}, "", "/game/" + game.id);
			window.dispatchEvent(new PopStateEvent("popstate"));
		}, 2000);
	}

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
	return (
		<div
			className="relative flex flex-col overflow-hidden h-screen w-screen"
			style={{ backgroundColor: 'rgba(94, 156, 171, 0.4)' }}
		>
			<Toast con={toast.content} type={toast.type} show={toast.show} />
			<div className="relative z-10">
				<Header />
			</div>
			<div className="flex items-center gap-10 my-10 flex-col md:flex-row md:justify-between mx-5">
				<TeamCard players={players} />
				<div className="gap-10 my-10 m-auto grid md:grid-rows-1 md:grid-cols-3 w-[80%] md:w-full items-center md:justify-between ">
					<div>
						<Badge text="local" />
						<CardContainer>
							<div className="flex justify-center">
								<img src={GameLocalImg} className="max-w-[100px]" />
							</div>
							<CardButton />
						</CardContainer>
					</div>
					<div className="justify-center">
						<Badge text="remote" />
						<CardContainer>
							<div className="flex justify-center">
								<img src={GameRemoteImg} className="max-w-[100px]" />
							</div>
							<CardButton onClick={handleClickRemote.bind(null, GameType.SOLO)} />
							<CardButton onClick={handleClickRemote.bind(null, GameType.TEAM)} />
						</CardContainer>
					</div>
					<div>
						<Badge text="tournament" />
						<CardContainer>
							<div className="flex justify-center">
								<img src={GameTournamentImg} className="max-w-[150px]" />
							</div>
							<div className="flex justify-center">
								<object type="image/svg+xml" data={TournamentButtonImg} className="max-w-[150px]"></object>
							</div>
						</CardContainer>
					</div>
				</div>
				<TeamCard players={players} />
			</div>
		</div>
	);
};

