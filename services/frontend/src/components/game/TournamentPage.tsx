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
import { useToast } from './toast';

export type TournamentStatus = 'ONGOING' | 'ENDED';

export interface Tournament {
	id: string;
	status: TournamentStatus;
	maxPlayers: number;
	games: { id: string }[];
	winnerId: number;
}

type GameData = {
	id: string;
	winningTeam: string;
	status: 'LIVE' | 'WAITING' | 'ENDED';
	players: { userId: number; username: string; }[]
	gamePlayers: { player: { userId: number; username: string; }; team: string }[]
}

export type TournamentState = Omit<Tournament, 'games'> & { games: GameData[], players: any };

const CardButton = ({ game }: { game: GameData | null }) => {
	let p1, p2 = null;
	let winnerId = null;

	if (game?.status === 'ENDED') {
		p1 = game?.gamePlayers[0]?.player ?? null;
		p2 = game?.gamePlayers[1]?.player ?? null;
		winnerId = game?.gamePlayers.find(p => p.team === game.winningTeam)?.player?.userId ?? null;
	}
	else {
		p1 = game?.players[0] ?? null;
		p2 = game?.players[1] ?? null;
	}
	return (
		<div className={"flex font-luckiest flex-row justify-center items-center "}>
			<div className={(winnerId === p1?.userId ? 'bg-teal-500 text-white' : 'bg-white text-[#5FDBE3]') + " pt-4 pb-3 px-8 text-xs"}>{p1?.username ?? 'TBD'}</div>
			<div className="bg-[#5FDBE3] px-4 pt-5 pb-4 text-2xl text-white">VS</div>
			<div className={(winnerId === p2?.userId ? 'bg-teal-500 text-white' : 'bg-white text-[#5FDBE3]') + " pt-4 pb-3 px-8 text-xs"}>{p2?.username ?? 'TBD'}</div>
		</div>
	)
}

const PlayerAvatar = ({ userId, avatar, username }: Omit<Player, 'score'>) => {
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

interface Friend {
	id: number;
	avatar: string;
	online: boolean;
	username: string
}

const Dialog = (props: { ref: { current: HTMLDialogElement | null }, tournamentId: string }) => {
	const [friends, setFriends] = useState<Friend[]>([]);

	const handlePlayerInvite = async (playerId: number) => {
		const response = await fetch(`${import.meta.env.VITE_GAME_SERVICE_HOST}:${import.meta.env.VITE_GAME_SERVICE_PORT}/api/tournament/invite`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				playerId,
				gameId: props.tournamentId
			})
		});
		if (!response.ok)
			console.log("failed to invite friend to game");
	}

	useEffect(() => {
		console.log('dialog useeffect');
		const fetchFriends = async () => {
			try {
				const response = await fetch(`${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/friends`,
					{
						credentials: 'include',
						method: "GET",
					}
				);
				if (!response.ok) {
					throw new Error(`Failed to fetch friends: ${response.status} ${response.statusText}`);
				}

				const data: Friend[] = await response.json();
				console.log('data', data);
				setFriends(data);
			} catch (err) {
				console.error('Error fetching friends:', err);
			}
		};
		fetchFriends();
	}, []);

	return <dialog ref={props.ref} closedby='any' className="min-w-[500px] max-h-[200px] bg-blue-300/80 shadow-lg rounded-lg px-10 py-8"

		style={{
			scrollbarColor: '#64B0C5 transparent',
			msOverflowStyle: 'auto',
		}}
	>
		{friends?.map(friend => {
			return (<div className="flex flex-row mb-2 scroll-pb-4 justify-between items-center gap-2">
				<div
					className="relative w-14 h-14 flex items-center 
                          justify-center bg-no-repeat bg-contain transition-transform duration-200 hover:scale-95"
					style={{
						backgroundImage: 'url("/images/home-assests/cir-online.svg")'
					}}

				>
					<img
						src={friend.avatar}
						className="w-10 h-10 rounded-full object-cover"
						alt="Avatar"
					/>
				</div>
				<div className="text-white font-bold text-xl font-poppins">{friend.username}</div>
				<button
					onclick={() => {
						handlePlayerInvite(friend.id)
					}}
					type="button"
					className="
				flex items-center gap-2 px-3 h-[30px]
				bg-[url('/images/home-assests/bg-FriendsAdd.svg')]
				bg-no-repeat bg-center bg-contain
				text-white font-semibold text-lg
				transition-transform duration-200 hover:scale-95 pl-1
				  ">
					<img
						src="/images/setting-assests/plus-friends.svg"
						alt="Add"
						className="w-7 h-7"
					/>
					<span>Invite</span>
				</button>
			</div>)

		})}
	</dialog >
}


export const TournamentPage = (props: { tournamentId: string }) => {
	const [tournament, setTournament] = useState<Tournament | null>(null);
	const [, , user] = useAuth()
	const [players, setPlayers] = useState<Player[]>([]);
	const [games, setGames] = useState<GameData[]>([]);
	const [showToast, Toast] = useToast();
	const [showButton, setShowButton] = useState(false);
	const dialogRef = useRef<HTMLDialogElement | null>(null);

	const eventRef = useRef<EventSource | null>(null);

	const handleStartGame = () => {
		games.map(game => {
			if (game?.status !== 'ENDED' && game?.players.find(p => p.userId === user?.id)) {
				window.history.pushState({}, "", "/game/" + game.id);
				window.dispatchEvent(new PopStateEvent("popstate"));
			}
		});
	}

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
		fetchTournament();

		const onUpdate = async (e: MessageEvent) => {
			const data: TournamentState = JSON.parse(e.data);
			// console.log('update:', data);
			let _players;
			console.log('datastatus: ', data.status)
			if (data?.status === 'ENDED') {
				console.log('ended:', data.games);
				_players = [data.games[0], data.games[1]].flatMap((game: GameData) => {
					if (!game) return;
					console.log("game:", game);
					return game.gamePlayers.map(gp => gp.player);
				});
				console.log("_players:", _players);
			}
			else {
				_players = data.players;
				_players.forEach((p: { id?: number }) => delete Object.assign(p, { userId: p.id }).id);
			}
			setTournament({
				status: data.status,
				id: data.id,
				maxPlayers: data.maxPlayers,
				winnerId: data.winnerId,
				games: data.games
			});
			console.log('set players', _players);
			setPlayers([..._players]);
			const games: GameData[] = data.games;
			setGames(games);
			if (tournament?.status === 'ENDED')
				return;
			games.map(game => {
				if (game?.status !== 'ENDED' && game.players.find(p => p.userId === user?.id)) {
					showToast('new game: ' + game.id);
					setShowButton(true);
				}
			});
		}

		const onStart = async (e: MessageEvent) => {
			console.log('start:', e.data);
			const data = JSON.parse(e.data);

			const games: GameData[] = data.games;
			games.map(game => {
				if (game?.status !== 'ENDED' && game.players.find(p => p.userId === user?.id)) {
					showToast('new game: ' + game.id);
					setTimeout(() => {
						window.history.pushState({}, "", "/game/" + game.id);
						window.dispatchEvent(new PopStateEvent("popstate"));
					}, 4000);
				}
			});
			setGames(games);
		}

		console.log('useEffect');
		if (eventRef.current !== null) {
			eventRef.current.close();
			eventRef.current.removeEventListener('UPDATE', onUpdate);
			eventRef.current.removeEventListener('START', onStart);
			eventRef.current.onmessage = null;
			eventRef.current = null;
		}
		console.log('sse is:', eventRef.current);
		eventRef.current = new EventSource('/api/tournament/' + props.tournamentId + '/updates');

		eventRef.current.onmessage = (ev: MessageEvent) => {
			console.log('received message:', ev.data);
		};
		eventRef.current.addEventListener('UPDATE', onUpdate);
		eventRef.current.addEventListener('START', onStart);
		console.log('sse is set', eventRef.current);
		return () => {
			console.log('cleanup called');
			if (!eventRef.current) return;
			eventRef.current.close();
			eventRef.current.removeEventListener('UPDATE', onUpdate);
			eventRef.current.removeEventListener('START', onStart);
			eventRef.current.onmessage = null;
			eventRef.current = null;
		}
	}, [props.tournamentId, user]);

	useEffect(() => {

	}, [tournament]);

	const handleAddClick = (e: Event) => {
		e.preventDefault();
		if (!dialogRef.current) return;
		dialogRef.current.showModal();
	}

	return (
		<div
			className="relative flex flex-col overflow-hidden h-screen w-screen"
			style={{ backgroundColor: 'rgba(94, 156, 171, 0.4)' }}
		>
			<Dialog tournamentId={tournament?.id ?? ''} ref={dialogRef} />
			<div className="relative z-10">
				<Header />
			</div>
			<div className="m-auto w-[90%]">
				{Toast}
				<div className="mx-auto mt-4 text-center text-lg text-white font-luckiest">Participants: {players.length ?? 0}/{tournament?.maxPlayers || 4}</div>
				<div className="flex justify-center gap-3 mb-4 w-[100%]">
					{players.length !== 0 ? (players.map(p => <PlayerAvatar avatar={p.avatar} username={p.username} userId={p.userId} />)) : <div></div>}
					{players.length < 4 ?
						<button onClick={handleAddClick} className="rounded-full w-14 h-14 border-4 text-center align-middle text-2xl text-white">+</button>
						: <div></div>}
				</div>
				{showButton && <button onClick={handleStartGame} className="border-2 rounded-lg shadow-lg bg-teal-200 hover:bg-teal-300 px-7 py-3 font-luckiest text-white">start</button>}
				<div className="bg-[#58D7DFAD]/30 flex flex-col justify-center py-20 mt-2 px-10 rounded-2xl border-white-100 border-2" >
					<div className="text-white font-luckiest text-lg mb-4 text-center w-[100%]">{tournament?.status}</div>
					<div class="grid grid-flow-col grid-rows-2 ">
						<div class="row-span-2 flex justify-center items-center tournament-game1-card"><CardButton game={games.at(0) ?? null} /></div>
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
							<div class="col-span-1 row-span-1 flex justify-center m-0 tournament-gamefinal-card items-center"><CardButton game={games.at(2) ?? null} /></div>
						</div>
						<div class="row-span-2 flex justify-center items-center tournament-game2-card"><CardButton game={games.at(1) || null} /></div>
					</div>
				</div>
			</div>
		</div>
	);
};

