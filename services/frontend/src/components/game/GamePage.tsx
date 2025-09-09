import { h } from '../../vdom/createElement';
import { Header } from '../home/Header';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';
import Avatar1 from '../../../images/home-assests/avatar1.svg';
import bgTeam from '../../../images/game-assets/bg-team.png';
import { GameCanvas } from './GameCanvas';


const AvatarCircle = ({ avatarImage, key }: { avatarImage: string, key: string }) => (
	<div className="relative w-11 h-11" key={key}>
		<img src="/images/home-assests/cir-offline.svg" className="absolute rounded-full shadow-[inset_0_0_10px_5px_#434146] inset-0 w-full h-full z-0" />
		<img
			src={avatarImage}
			className="w-[90%] mx-auto rounded-full object-cover z-10"
			alt={`${key}`}
		/>
	</div>
);

const TeamBadge = ({ player, reverse = false }: { player: Player, reverse: boolean }) => {
	let nameBadge =
		<div className="uppercase font-inria text-xs text-nowrap py-6 px-10 text-[#166181]" style={{
			borderImageSource: `url(${bgTeam})`,
			borderImageSlice: 60,
			borderImageWidth: "auto",
			lineHeight: 0
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

const TeamCard = ({ players }: { players: Player[] }) => {
	return (
		<div className="inline-flex flex-col h-full gap-y-3 px-2 py-4 bg-blue-200 bg-opacity-20 rounded-lg">
			{players.map(player => (
				<AvatarCircle avatarImage={player.avatarImage} key={player.id} />
			))}
		</div>
	);
}

export const GamePage: ComponentFunction = () => {
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
			<div className="z-10 flex items-center h-[100%] gap-10 my-10 flex-row justify-between mx-5">
				<TeamCard players={players} />
				<div className="w-[800px]">
					<div className="flex justify-between"><TeamBadge reverse={false} player={players[0]} />
						<TeamBadge reverse={true} player={players[0]} /></div>
					<div className="p-[0.6em] my-2 bg-[#91BFBF] shadow-xs shadow-gray-400 rounded-xl">
						<GameCanvas />
					</div>
				</div>
				<TeamCard players={players} />
			</div>
		</div>
	);
};
