import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useState } from '../../hooks/useState';
import { createNewGame } from '../game/utils';
import { GameType } from '../game/game';

// Define MouseEvent type since we're not using React directly
type MouseEvent = {
	currentTarget: HTMLElement;
};

interface Friend {
	id: number;
	username?: string;
	avatar?: string;
	online?: boolean;
	name: string;
	image: string;
}

interface OnlineProps {
	friends: Friend[];
	position?: 'left' | 'right';
	gameId?: string
}

export const Online: ComponentFunction<OnlineProps> = ({ friends, position = 'right', gameId = "" }) => {
	// Normalize incoming friends to an array to avoid runtime errors
	const normalizeFriends = (value: any): Friend[] => {
		if (Array.isArray(value)) return value as Friend[];
		if (value && Array.isArray(value.friends)) return value.friends as Friend[];
		return [] as Friend[];
	};
	const [showinfo, setbareinfo] = useState<boolean>(false);
	const [nameFriend, setNameFriend] = useState<Friend | null>(null);
	// Keep a local copy only when we perform local refreshes
	const [localFriends, setLocalFriends] = useState<Friend[] | null>(null);
	const baseFriends = normalizeFriends(friends);
	const currentFriends = localFriends ?? baseFriends;
	const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
	const onlineFriends = Array.isArray(currentFriends) ? currentFriends.filter((f: any) => !!f?.online) : [];

	const handleProfileClick = (username: string, e: Event) => {
		e.preventDefault();
		e.stopPropagation();
		window.history.pushState({}, "", `/profile/${username}`);
		window.dispatchEvent(new PopStateEvent("popstate"));
	};

	const handleGameInvite = async (playerId: number) => {
		let id;
		if (gameId)
			id = gameId;
		else {
			const game = await createNewGame(GameType.SOLO);
			if (!game)
				return;
			console.log("New game created:", game.id);
			id = game.id;
		}
		const response = await fetch(`${import.meta.env.VITE_GAME_SERVICE_HOST}:${import.meta.env.VITE_GAME_SERVICE_PORT}/api/game/invite`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				playerId,
				gameId
			})
		});
		if (!response.ok)
			console.log("failed to invite friend to game");
		console.log("Player invited to game");
	}

	const handleBlockUser = async (username: string, action: 'block') => {
		try {
			const response = await fetch(`${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/actions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ username, action })
			});

			if (!response.ok) {
				throw new Error(`Failed to ${action} friend`);
			}

			// Refresh only this component view by fetching the latest friends list
			try {
				const refreshRes = await fetch(`${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/friends`, {
					method: 'GET',
					credentials: 'include',
				});
				if (refreshRes.ok) {
					const updated = await refreshRes.json();
					setLocalFriends(normalizeFriends(updated));
				} else {
					console.warn('Friends refresh failed:', refreshRes.status, refreshRes.statusText);
				}
			} catch (e) {
				console.warn('Friends refresh error:', e);
			}
			setbareinfo(false);
		} catch (err) {
			console.error(`Error performing ${action} action:`, err);
		}
	};


	return (
		<div className="relative flex flex-col gap-2 p-2 bg-sky-custom/20 rounded-lg max-h-[80vh] overflow-y-auto">
			{onlineFriends.map(friend => (
				<div
					key={friend.id}
					className="relative w-14 h-14 flex items-center 
                          justify-center bg-no-repeat bg-contain transition-transform duration-200 hover:scale-95"
					style={{
						backgroundImage: 'url("/images/home-assests/cir-online.svg")',
					}}
					onMouseEnter={(e: MouseEvent) => {
						if (position === 'right') return;
						if (showinfo === true) return;
						const target = e.currentTarget as HTMLElement;
						const rect = target.getBoundingClientRect();
						setPopupPosition({
							top: rect.top,
							left: rect.right + 10
						});
						setNameFriend(friend);
						setbareinfo(true);
					}}
				//   onMouseLeave={() => {
				//   setbareinfo(false);
				// }}
				>
					<img
						src={friend.avatar || '/images/default-avatar.png'}
						alt={friend.username}
						className="w-10 h-10 rounded-full object-cover"
					/>
				</div>
			))}
			{onlineFriends?.length === 0 && <p className="text-white text-sm">No friends online</p>}
			{showinfo && nameFriend && (
				<div className="fixed z-50 w-[300px] h-[120px] bg-chat-send/85
                        rounded-3xl p-6 shadow-2xl
                        flex flex-col items-center  justify-center gap-4"
					style={{
						top: `${popupPosition.top}px`,
						left: `${popupPosition.left}px`
					}}>
					<p className="text-white text-lg font-semibold">
						{nameFriend.username}
					</p>

					<div className="flex flex-row items-center justify-center gap-3 w-full">

						{[
							{ src: "/images/chat/close.png", alt: "close", onClick: () => setbareinfo(false) },
							{ src: "/images/chat/profilchat.png", alt: "profilchat", onClick: (e: Event) => { if (nameFriend) handleProfileClick(nameFriend.username || nameFriend.name, e) } },
							{ src: "/images/chat/gamechat.png", alt: "chatgame", onClick: () => handleGameInvite(nameFriend.id) },
							{ src: "/images/chat/block.png", alt: "blockchat", onClick: () => handleBlockUser(nameFriend.username || nameFriend.name, 'block') }
						].map((btn, i) => (
							<button
								key={i}
								className="flex-1 flex items-center justify-center rounded-xl shadow hover:bg-white/90 transition p-2"
								onClick={btn.onClick}
							>
								<img className="h-8 w-8 object-contain" src={btn.src} alt={btn.alt} />
							</button>
						))}

					</div>
				</div>
			)}
		</div>
	);
};
