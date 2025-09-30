import { h } from '../../vdom/createElement';
import { Header } from '../home/Header';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';
import BadgeBg from '../../../images/game-badge-bg.png';
import GameRemoteImg from '../../../images/game-remote.png';
import GameLocalImg from '../../../images/game-local.png';
import GameTournamentImg from '../../../images/game-tournament.png';
import TournamentButtonSvg from '../../../images/tournament-button.svg';
import { TeamCard } from './TeamCard';
import { useAuth } from '../../hooks/useAuth';
import { GameMode, GameType } from './game';
import { createNewGame, redirectToActiveGame } from './utils';
import { useToast } from './toast';
import { fetchGameApi } from './fetch';
import { Modes } from './Modes';
import { ToggleButton } from './ToggleButton';

export const MODE_POINTS = {
	[GameMode.CLASSIC]: 150,
	[GameMode.SPEED]: 300,
	[GameMode.VANISH]: 550,
	[GameMode.GOLD]: 1000,
}

const Badge = (props: { text: string }) => {
	return (
		<div className="flex justify-center items-center object-fit leading-none">
			<div className={"bg-[url(/images/game-badge-bg.png)] font-luckiest min-w-[200px] text-center text-white p-10 bg-center bg-no-repeat bg-contain"}>
				{props.text}
			</div>
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
	const [showToast, Toast] = useToast();
	const [mode, setMode] = useState<GameMode>(GameMode.CLASSIC);

	//console.log("mode: ", mode);
	useEffect(() => {
		if (!user)
			return;
		redirectToActiveGame();
	}, [user])

	useEffect(() => {

	}, [user]);

	const handleClickRemote = async (type: GameType, e: Event) => {
		//console.log(e);
		//console.log(type);
		const { status, game, error } = await createNewGame(type, mode);
		if (status !== 'ok')
			return showToast(error, 'error');
		else if (!game)
			return showToast("Failed to create game!", "error");
		showToast("[!] Game created successfully: " + game.id);
		setTimeout(() => {
			window.history.pushState({}, "", "/game/" + game.id);
			window.dispatchEvent(new PopStateEvent("popstate"));
		}, 2000);
	}

	return (
		<div
			className="relative flex flex-col overflow-hidden h-screen w-screen"
			style={{ backgroundColor: 'rgba(94, 156, 171, 0.4)' }}
		>
			{Toast}
			<div className="relative z-10">
				<Header />
			</div>
			<div className="gap-10 my-10 m-auto grid md:grid-rows-1 md:grid-cols-3 w-[80%] md:w-full items-center md:justify-between  px-7">
				<div>
					<Badge text="local" />
					<CardContainer>
						<div className="flex justify-center">
							<img src={GameLocalImg} className="max-w-[100px] pointer-events-none" />
						</div>
						<CardButton onClick={() => {
							localStorage.setItem('gameMode', mode);
							window.history.pushState({}, "", "/game/local");
							window.dispatchEvent(new PopStateEvent("popstate"));
						}} />
					</CardContainer>
				</div>
				<div className="justify-center">
					<Badge text="remote" />
					<CardContainer>
						<div className="flex justify-center">
							<img src={GameRemoteImg} className="max-w-[100px] pointer-events-none" />
						</div>
						<ToggleButton onStart={(type: GameType) => handleClickRemote(type, new Event("click"))} />
					</CardContainer>
				</div>
				<div>
					<Badge text="tournament" />
					<CardContainer>
						<div className="flex justify-center">
							<img src={GameTournamentImg} className="max-w-[150px] pointer-events-none" />
						</div>
						<div className="flex justify-center">
							{/* <object type="image/svg+xml" data={TournamentButtonSvg} className="max-w-[150px]"></object> */}
							<button onClick={async () => {
								try {
									const tournament = await fetchGameApi('/tournament/create', 'POST');
									window.history.pushState({}, "", "/tournament/" + tournament.id);
									window.dispatchEvent(new PopStateEvent("popstate"));
								}
								catch (err) {
									//console.log("create tournament error: ", err)
								}
							}}>
								<img src={TournamentButtonSvg} className="hover:scale-[0.96]" />
							</button>
						</div>
					</CardContainer>
				</div>
			</div>
			<div className="flex justify-center w-full">
				<Modes modes={mode} setModes={(mode: GameMode) => {
					setMode(mode)
				}}></Modes>
			</div>
		</div>
	);
};

