import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useEffect } from "../../hooks/useEffect";
import { useState } from '../../hooks/useState';
import { useRef } from '../../hooks/useRef';
import { Online } from './online';
import { Barre } from './barre_friend';
import { FriendItem } from '../home/ChatPanel'
import { createNewGame } from '../game/utils';
import { GameType } from '../game/game';

export interface Friend {
	id: number;
	name: string;
	image: string;
}


interface Message {
	text: string;
	time: string;
	from: number;
	to: number;
}

export const Bchat: ComponentFunction = () => {
	const socket = useRef<WebSocket | null>(null);
	const [message, setMessage] = useState<string>('');
	const [messages, setMessages] = useState<Message[]>([]);
	const [id, setId] = useState<number | null>(null);
	const heartbeatInterval = useRef<number | null>(null);
	const [friends, setFriends] = useState<Friend[]>([]);
	const [active, setActive] = useState<boolean>(false);
	const [nameFriend, setNameFriend] = useState<Friend | null>(null);
	const [isBlocked, setIsBlocked] = useState<boolean>(false);
	const [allfriend, setallfriend] = useState<Friend[]>([]);
	const [showinfo, setbareinfo] = useState<boolean>(false);
	const [onlinefriends, onlinefriendssetFriends] = useState<Friend[]>([]);
	const [name, setname] = useState<number | null>(null);

	const handleGameInvite = async (playerId: number) => {
		const {status, game, error} = await createNewGame(GameType.SOLO);
		if (status !== 'ok')
			return;
		console.log("New game created:", game.id);
		const gameId = game.id;
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
		window.history.pushState({}, "", "/game/" + game.id);
		window.dispatchEvent(new PopStateEvent("popstate"));
		setbareinfo(false);
		setNameFriend(null);
		console.log("Player invited to game");
	}

	useEffect(() => {
		socket.current = new WebSocket(`${import.meta.env.VITE_WS_CHAT_SERVICE_HOST}/ws/chat`);

		socket.current.onopen = async () => {
			console.log("WebSocket connected");

			try {
				const resUser = await fetch(`${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/chat/me`, {
					credentials: 'include',
					method: "GET",
				});
				if (!resUser.ok) throw new Error('Cannot fetch user');
				const user = await resUser.json();
				console.log("user us : ", user);
				setname(user.username)
				setId(user.id);

				const resFriends = await fetch(`${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/chat/friends`, {
					method: 'GET',
					credentials: 'include',
				});

				const friendsList = await resFriends.json();
				console.log("friend is : ", friendsList);
				setFriends(friendsList);
				setallfriend(friendsList)
				socket.current?.send(JSON.stringify({ type: 'user-info', ...user, friends: friendsList }));

				const resHistory = await fetch(`${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/chat/messages/${user.id}`);
				const history = await resHistory.json();
				const normalized = Array.isArray(history)
					? history.map((m: any) => ({
						text: m.text,
						time: new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
						from: Number(m.fromId),
						to: Number(m.toId),
					}))
					: [];
				setMessages(normalized);

			} catch (err) {
				console.error("---> ", err);
			}

			heartbeatInterval.current = setInterval(() => {
				if (socket.current?.readyState === WebSocket.OPEN) {
					socket.current.send(JSON.stringify({ type: 'ping' }));
				}
			}, 30000);
		};
		socket.current.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'message') {
				setMessages(prev => [...prev, {
					text: data.message,
					time: data.time,
					from: Number(data.from),
					to: Number(data.to),
				}]);
			}
			if (data.type === 'pong')
				return;
		};

		socket.current.onclose = () => console.log('Disconnected from server');
		socket.current.onerror = (error) => console.log('WebSocket error', error);

		return () => {
			if (heartbeatInterval.current) {
				clearInterval(heartbeatInterval.current);
			}
			socket.current?.close();
		};
	}, []);

	async function sendMessage(info: { from: number | null; to: number }, messageText: string) {
		if (socket.current && message.trim() !== '') {
			const data = JSON.stringify({ type: 'message', username: name, message: message, from: info.from, to: info.to, username_to: nameFriend?.name });
			const resBlocked = await fetch(`${import.meta.env.VITE_CHAT_SERVICE_HOST}/api/chat/blocked/${info.to}`, {
				method: 'GET',
				credentials: 'include',
			});
			const blockedsList = await resBlocked.json();
			if (blockedsList.status === 'blocked') {
				setIsBlocked(true);
				return
			}
			else {
				setIsBlocked(false);
			}
			console.log("blocked is : ", blockedsList.status)
			socket.current.send(data);
			setMessage('');
		}
	}

	const handleBlockUser = async () => {
		if (nameFriend && id !== null) {
			try {
				const resBlock = await fetch(
					`${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/actions`,
					{
						method: 'POST',
						credentials: 'include',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							username: nameFriend.name,
							action: 'block',
						}),
					}
				);

				if (!resBlock.ok) {
					alert("Error blocking the user: " + resBlock.statusText);
					return;
				}

				const blockStatus = await resBlock.json();
				if (blockStatus.success) {
					setIsBlocked(true);
					alert("User has been blocked.");
				} else {
					alert("Error blocking the user: " + (blockStatus.message || "Unknown error"));
				}
			} catch (error) {
				alert("Error blocking the user: " + error);
			}
		}
	};


	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && nameFriend && id !== null) {
			sendMessage({ from: id, to: nameFriend.id }, message);
		}
	};

	const handleSubmit = (e: Event) => {
		e.preventDefault();
		if (nameFriend && id !== null) {
			sendMessage({ from: id, to: nameFriend.id }, message);
		}
	};
	const handleProfileClick = (username: string, e: Event) => {
		e.preventDefault();
		e.stopPropagation();
		window.history.pushState({}, "", `/profile/${username}`);
		window.dispatchEvent(new PopStateEvent("popstate"));
	};

	useEffect(() => {
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

				const data = await response.json();
				onlinefriendssetFriends(data);
			} catch (err) {
				console.error('Error fetching friends:', err);
			}
		};
		fetchFriends();
		const intervalId = setInterval(() => {
			fetchFriends();
		}, 2000);
		return () => {
			clearInterval(intervalId);
		};
	}, []);
	return (
		<div>
			<div>
				<div>
					<div
						className="absolute top-14% inset-0 bg-sky-custom/35 w-5% h-82%  rounded-lg object-cover  mx-1% overflow-y-auto" style={{
							scrollbarWidth: 'thin',
							scrollbarColor: '#659EAC transparent',
							msOverflowStyle: 'auto',
						}}>
						<Online
							friends={onlinefriends}
							position="left"
						/>
					</div>
					<img src='images/chat/icon_online.png' alt="icon online" className=" absolute top-12% mx-4% h-2.5% w-1.5% "></img>
					<div
						className="absolute top-14% right-0 bg-sky-custom/35 w-5% h-82%  rounded-lg object-cover  mx-1% overflow-y-auto" style={{
							scrollbarWidth: 'thin',
							scrollbarColor: '#4D8995 transparent',
							msOverflowStyle: 'auto',
						}}>
						<Online
							friends={onlinefriends}
							position="right"
						/>
					</div>
					<img src='images/chat/icon_online.png' alt="icon online" className=" absolute top-12% mx-97% h-2.5% w-1.5%"></img>
				</div>

				<Barre
					friend={allfriend}
					onSelectFriend={setNameFriend}
					messages={messages}
					currentUserId={id}
				/>
			</div>
			{showinfo && nameFriend && (
				<div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                            w-[300px] bg-chat-send/20
                            rounded-3xl p-6 shadow-2xl
                            flex flex-col items-center gap-4 z-50">

					<p className="text-white text-lg font-semibold">
					</p>

					<div className="flex flex-row items-center justify-center gap-3 w-full">

						{[
							{ src: "/images/chat/close.png", alt: "close", onClick: () => setbareinfo(false) },
							{ src: "/images/chat/profilchat.png", alt: "profilchat", onClick: (e: Event) => { if (nameFriend) handleProfileClick(nameFriend.name, e) } },
							{ src: "/images/chat/gamechat.png", alt: "chatgame", onClick: () => {handleGameInvite(nameFriend.id)} },
							{ src: "/images/chat/block.png", alt: "blockchat", onClick: handleBlockUser }
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


			<div className="absolute w-[65%] h-[82%] top-[14%] left-[28%] m-[0.1%]">
				<img className='w-full h-full object-cover rounded-2xl' src="/images/src-image/backg_chat.png" alt='background chat' />

				<div className="absolute w-full h-[6%] top-[0.1%] bg-bleu-custom/50 z-10 rounded-t-xl hover:shadow-xl transition-all">
					<h2 className='ml-[5%] top-[15%] absolute font-poppins font-semibold w-full h-full text-white'>
						{nameFriend ? nameFriend.name : ""}
					</h2>
					<button onClick={() => nameFriend ? setbareinfo(!showinfo) : setbareinfo(showinfo)}>
						<img
							className='absolute top-2 left-2 rounded-full h-10 w-10'
							src={nameFriend ? nameFriend.image : "/images/chat/lock.png"}
							alt='avatar'
						/>
					</button>
				</div>

				<div
					className="absolute top-[8%] left-[2%] right-[2%] bottom-[12%] overflow-y-auto flex flex-col gap-2"
					style={{ scrollbarWidth: 'thin', scrollbarColor: '#3BACCE transparent', msOverflowStyle: 'auto' }}
				>
					{messages
						.filter(m => (m.from === id && m.to === nameFriend?.id) || (m.from === nameFriend?.id && m.to === id))
						.map((m, i) => (
							<div key={i} className={`px-3 py-1 text-gray-50 rounded-xl w-fit inline-block ${m.from === id ? 'self-end bg-chat-send' : 'self-start bg-chat-revice'}`}>
								<span>{m.text}</span>
								<br />
								<span className="text-xs opacity-70">{m.time}</span>
							</div>
						))}
				</div>

				<div className="absolute left-2% w-97% h-7% bottom-2% transition-all flex">
					{nameFriend && (
						<form onSubmit={handleSubmit} className="w-full">
							{isBlocked && (
								<div className="absolute -top-90% left-1% bg-teal-500 text-fuchsia-50 px-4 py-2 rounded-lg shadow-lg">
									User blocked. You cannot send messages to this user.
								</div>
							)}
							<input
								className='w-full h-full rounded-3xl px-3 hover:shadow-lg opacity-40 placeholder:text-[1vw] focus:outline-none'
								value={message}
								onChange={(e: Event) => {
									const target = e.target as HTMLInputElement;
									setMessage(target.value);
								}}
								onKeyDown={handleKeyDown}
								placeholder="Type your message..."
							/>
							<button type="submit" > <img className='absolute left-96% top-23% w-3% h-50%' src='images/chat/send-msg.png' alt="icon send" /> </button>
						</form>
					)}
				</div>
			</div>
		</div>
	);
};
