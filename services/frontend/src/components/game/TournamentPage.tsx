import { h } from '../../vdom/createElement';
import { Header } from '../home/Header';
import GameTournamentImg from '../../../images/game-tournament.png';
import './style.css';
import { useEffect } from '../../hooks/useEffect';
import { fetchGameApi } from './fetch';
import { useState } from '../../hooks/useState';
import { useRef } from '../../hooks/useRef';
import { useAuth } from '../../hooks/useAuth';
import { Player } from './GamePage';

const CardButton = ({ p1, p2 }: { p1?: string, p2?: string }) => {
	return (
		<div className={"flex font-luckiest flex-row justify-center items-center "}>
			<div className="bg-white pt-4 pb-3 px-8 text-[#5FDBE3] text-xs">{p1 ?? 'TBD'}</div>
			<div className="bg-[#5FDBE3] px-4 pt-5 pb-4 text-2xl text-white">VS</div>
			<div className="bg-white pt-4 pb-3 px-8 text-[#5FDBE3] text-xs">{p2 ?? 'TBD'}</div>
		</div>
	)
}

export type TournamentStatus = 'ONGOING' | 'ENDED';

export interface Tournament {
	id: string;
	status: TournamentStatus;
	maxPlayers: number;
	games: { id: string }[];
	winnerId: number;
}

const PlayerAvatar = ({ userId, avatar, username }: Player) => {
	return (

		<div
			key={userId}
			className="relative w-14 h-14 flex items-center 
                          justify-center bg-no-repeat bg-contain transition-transform duration-200 hover:scale-95"
			style={{
				backgroundImage: 'url("/images/home-assests/cir-online.svg")',
			}}
		>
			<img
				src={avatar || '/images/default-avatar.png'}
				alt={username}
				className="w-10 h-10 rounded-full object-cover"
			/>
		</div>
	);
}

export const TournamentPage = (props: { tournamentId: string }) => {
	const [tournament, setTournament] = useState<Tournament | null>(null);
	const [, , user] = useAuth()
	const [players, setPlayers] = useState<Player[]>([]);

	const eventRef = useRef<EventSource | null>(null);


	useEffect(() => {
		const fetchTournament = async () => {
			try {
				const data = await fetchGameApi('/tournament/' + props.tournamentId, 'GET');
				setTournament(data);
			}
			catch (err) {
				console.error("get tournament error: ", err);
			}
		}
		const onHealth = (e: MessageEvent) => {
			console.log('health check:', e.data);
		}
		const onUpdate = async (e: MessageEvent) => {
			console.log('update:', e.data);
			const data = JSON.parse(e.data);
			console.log(typeof data.players, data.players);
			console.log(data?.players ? 'true' : 'false');
			if (!data?.players)
				return;
			data.players.forEach((p: { id?: number }) => delete Object.assign(p, { userId: p.id }).id);
			console.log('set players', data.players);
			setPlayers([...data.players]);
		}
		fetchTournament();
		console.log('useEffect');
		if (eventRef.current !== null) {
			eventRef.current.close();
			eventRef.current.removeEventListener('HEALTH', onHealth);
			eventRef.current.removeEventListener('UPDATE', onUpdate);
			eventRef.current.onmessage = null;
			eventRef.current = null;
		}
		console.log('sse is:', eventRef.current);
		eventRef.current = new EventSource('/api/tournament/' + props.tournamentId + '/updates');

		eventRef.current.onmessage = (ev: MessageEvent) => {
			console.log('received message:', ev.data);
		};
		eventRef.current.addEventListener('HEALTH', onHealth);
		eventRef.current.addEventListener('UPDATE', onUpdate);
		console.log('sse is set', eventRef.current);
		return () => {
			console.log('cleanup called');
			if (!eventRef.current) return;
			eventRef.current.close();
			eventRef.current.removeEventListener('HEALTH', onHealth);
			eventRef.current.removeEventListener('UPDATE', onUpdate);
			eventRef.current.onmessage = null;
			eventRef.current = null;
		}
	}, [props.tournamentId]);

	console.log('render', players, 'players length:', players.length);

	return (
		<div
			className="relative flex flex-col overflow-hidden h-screen w-screen"
			style={{ backgroundColor: 'rgba(94, 156, 171, 0.4)' }}
		>
			<div className="relative z-10">
				<Header />
			</div>
			<div className="m-auto w-[90%]">
				<div className="mx-auto mt-4 text-center text-lg text-white font-luckiest">Participants: {players.length ?? 0}/{tournament?.maxPlayers || 4}</div>
				<div className="flex justify-center gap-3 mb-4 w-[100%]">
					{players.length !== 0 ? (players.map(p => <PlayerAvatar avatar={p.avatar} username={p.username} userId={p.userId} />)) : <div></div>}
					<button className="rounded-full w-14 h-14 border-4 text-center align-middle text-2xl text-white">+</button>
				</div>
				<div className="bg-[#58D7DFAD]/30 flex flex-col justify-center py-20 mt-2 px-10 rounded-2xl border-white-100 border-2" >
					<div className="text-white font-luckiest text-lg text-center w-[100%]">ID: {tournament?.id}</div>
					<div class="grid grid-flow-col grid-rows-2 ">
						<div class="row-span-2 flex justify-center items-center tournament-game1-card"><CardButton /></div>
						<div class="col-span-1 flex justify-center items-center">
							<img src={GameTournamentImg} className="max-w-[150px]" />
						</div>
						<div className="flex flex-col justify-center mx-[-2px]">
							<div className="flex justify-center ">
								<div className="border-r-0 w-full border-t-2 min-h-[4vh] border-white">
								</div>
								<div className="border-l-2 w-full border-t-2 min-h-[2vh] border-white">
								</div>
							</div>
							<div class="col-span-1 row-span-1 flex justify-center m-0 tournament-gamefinal-card items-center"><CardButton /></div>
						</div>
						<div class="row-span-2 flex justify-center items-center tournament-game2-card"><CardButton /></div>
					</div>
				</div>
			</div>
		</div>
	);
};

