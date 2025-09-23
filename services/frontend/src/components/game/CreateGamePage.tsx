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

const Badge = (props: {text: string}) =>
{
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

const CardButton = () =>
{
	return (
				<div className="flex my-3 font-luckiest flex-row justify-center items-center">
					<div className="bg-white pt-4 pb-3 px-8 text-[#5FDBE3] text-xs">One</div>
					<div className="bg-[#5FDBE3] px-4 pt-5 pb-4 text-2xl text-white">VS</div>
					<div className="bg-white pt-4 pb-3 px-8 text-[#5FDBE3] text-xs">One</div>
				</div>
	)
}

export const CreateGamePage: ComponentFunction = () => {
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
			<div className="z-10 gap-10 my-10 m-auto grid md:grid-rows-1 md:grid-cols-3 w-[80%] md:w-full items-center md:justify-between ">
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
						<CardButton />
						<CardButton />
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

