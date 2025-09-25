import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';
import { useRef } from '../../hooks/useRef';
import { ws } from '../../main'
import { redirectToActiveGame } from '../game/utils';

type NotificationType = 'MATCH_NOTIFICATION' | 'FRIEND_REQUEST' | 'TOURNAMENT_NOTIFICATION';

interface Notification {
	userId: number;
	type: NotificationType;
	notifierId: number;
	readed: boolean;
	createdAt: string;
	gameId?: string;
	user: {
		id: number;
		username: string;
		avatar: string;
	};
}

interface NotificationPanelProps {
	modalManager: {
		activeModal: 'search' | 'notification' | null;
		openModal: (modal: 'search' | 'notification') => void;
		closeModal: () => void;
		isModalOpen: (modal: 'search' | 'notification') => boolean;
	};
	open: boolean;
}

export const NotificationPanel: ComponentFunction<NotificationPanelProps> = ({ modalManager, open }) => {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [showAll, setShowAll] = useState(false);

	const fetchNotifications = async () => {
		try {
			const response = await fetch(`${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/notifications`,
				{ credentials: 'include' });

			if (!response.ok) {
				throw new Error('Failed to fetch notifications');
			}

			const data = await response.json();
			setNotifications(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error('Error fetching notifications:', err);
			setNotifications([]);
		}
	};

	useEffect(() => {
		if (open) {
			fetchNotifications();
		}
	}, [open]);

	const handleFriendAction = async (username: string, action: 'accept' | 'cancel') => {
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
			await fetchNotifications();
		} catch (err) {
			console.error(`Error performing ${action} action:`, err);
		}
	};
	//  we wait for badr igad lina dakchi dyal matchat
	const handleMatchAction = async (gameId: string, action: 'accept' | 'refuse') => {
		try {
			let response;
			if (action === 'refuse') {
				response = await fetch(`${import.meta.env.VITE_GAME_SERVICE_HOST}:${import.meta.env.VITE_GAME_SERVICE_PORT}/api/game/invite/decline`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ gameId })
				});
				if (!response.ok) throw new Error(`Failed to ${action} match`);
			}
			else {
				response = await fetch(`${import.meta.env.VITE_GAME_SERVICE_HOST}:${import.meta.env.VITE_GAME_SERVICE_PORT}/api/game/join`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ gameId })
				});
				if (!response.ok) throw new Error(`Failed to ${action} match`);
				const data = await response.json();
				window.history.pushState({}, "", "/game/" + data?.id);
				window.dispatchEvent(new PopStateEvent("popstate"));
			}

			await fetchNotifications();
		} catch (err) {
			console.error(`Error performing ${action} match action:`, err);
		}
	};

	const renderActionButton = (notification: Notification) => {
		if (notification.type === 'FRIEND_REQUEST') {
			return (
				<div className="flex ">
					<button
						onClick={() => handleFriendAction(notification.user.username, 'accept')}
						className="
            flex items-center gap-1 px-4 h-[20px] min-w-[65px]
            bg-[url('/images/setting-assests/bg-accept.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-xs
            transition-transform duration-200 hover:scale-95 
          ">
						<i className="fa-solid fa-check text-xs"></i>
						<span>Accept</span>
					</button>
					<button
						onClick={() => handleFriendAction(notification.user.username, 'cancel')}
						className="
            flex items-center gap-1 px-4 h-[20px] min-w-[65px]
            bg-[url('/images/setting-assests/bg-decline.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-xs
            transition-transform duration-200 hover:scale-95 
          ">
						<i className="fa-solid fa-xmark text-xs"></i>
						<span>Decline</span>
					</button>
				</div>
			);
		}

		if (notification.type === 'MATCH_NOTIFICATION' && notification.gameId) {
			return (
				<div className="flex gap-1 justify-end">
					<button
						onClick={() => notification.gameId && handleMatchAction(notification.gameId, 'accept')}
						className="
            flex items-center gap-1 px-2 h-[20px] min-w-[70px]
            bg-[url('/images/setting-assests/bg-accept.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-[10px]
            transition-transform duration-200 hover:scale-95 
          ">
						<i className="fa-solid fa-table-tennis-paddle-ball text-red-500 text-[10px]"></i>
						<span>Play match</span>
					</button>
					<button
						onClick={() => notification.gameId && handleMatchAction(notification.gameId, 'refuse')}
						className="
            flex items-center gap-1 px-2 h-[20px] min-w-[50px]
            bg-[url('/images/setting-assests/bg-decline.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-[10px]
            transition-transform duration-200 hover:scale-95 
          ">
						<i className="fa-solid fa-xmark text-[10px]"></i>
						<span>refuse</span>
					</button>
				</div>
			);
		}
		if (notification.type === 'TOURNAMENT_NOTIFICATION' && notification.gameId) {
			return (
				<div className="flex gap-1 justify-end">
					<button
						onClick={() => notification.gameId && handleMatchAction(notification.gameId, 'accept')}
						className="
            flex items-center gap-1 px-2 h-[20px] min-w-[70px]
            bg-[url('/images/setting-assests/bg-accept.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-[10px]
            transition-transform duration-200 hover:scale-95 
          ">
						<i className="fa-solid fa-table-tennis-paddle-ball text-red-500 text-[10px]"></i>
						<span>Join tournament</span>
					</button>
					<button
						onClick={() => notification.gameId && handleMatchAction(notification.gameId, 'refuse')}
						className="
            flex items-center gap-1 px-2 h-[20px] min-w-[50px]
            bg-[url('/images/setting-assests/bg-decline.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-[10px]
            transition-transform duration-200 hover:scale-95 
          ">
						<i className="fa-solid fa-xmark text-[10px]"></i>
						<span>refuse</span>
					</button>
				</div>
			);
		}

		return null;
	};

	const getNotificationText = (notification: Notification) => {
		if (notification.type === 'FRIEND_REQUEST') {
			return 'sent you a friend request';
		}
		if (notification.type === 'MATCH_NOTIFICATION') {
			return 'wants to play a match with you';
		}
		if (notification.type === 'TOURNAMENT_NOTIFICATION') {
			return 'wants to play a tournament with you';
		}
		return '';
	};

	const displayNotifications = showAll
		? notifications
		: notifications.slice(0, 3);
	const totalCount = notifications.length;

	return (
		<div
			className={`absolute top-[58px] -right-40 mt-2 w-96 h-96 bg-[#5D9FA9] opacity-95 rounded-lg shadow-xl flex flex-col z-[9998] ${open ? '' : 'hidden'}`}
			onClick={(e: MouseEvent) => e.stopPropagation()}
		>
			<div className="p-4 border-b border-[#4E92A2] bg-[#5D9FA9] text-white rounded-t-lg">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">Your Notifications</h3>
				</div>
				<div className="mt-4 translate-y-2">
					<div className="flex justify-center items-center w-20 h-6
               gap-2 bg-[#FFFFFF] opacity-80 rounded-lg shadow-md 
               hover:shadow-2xl  shadow-black/30">
						<span className="text-sm font-medium text-[#62CEF5] gap-2">All</span>
						<div className="w-3 h-3 bg-green-500 text-white mb-[2px] flex items-center justify-center">
							<span className="text-xs text-[#FFFFFF]  gap-2">{totalCount}</span>
						</div>
					</div>
				</div>
			</div>

			<div className={`flex-1 ${showAll ? 'overflow-y-auto' : 'overflow-hidden'}`}>
				<ul className="space-y-1 p-2 px-5"
					style={{
						scrollbarWidth: 'thin',
						scrollbarColor: '#64B0C5 transparent',
						msOverflowStyle: 'auto',
					}}>
					{displayNotifications.map((notification, index) => (
						<li
							key={`${notification.notifierId}-${notification.type}-${index}`}
							className="p-1 border-b border-[#4E92A2]  h-[80px] w-[300px] flex flex-col justify-between"
						>
							<div className="flex items-center gap-2">
								<div
									className="relative w-8 h-8 flex items-center justify-center 
                             bg-no-repeat bg-contain flex-shrink-0"
									style={{ backgroundImage: 'url("/images/home-assests/cir-online.svg")' }}
								>
									<img
										src={notification.user.avatar || '/images/default-avatar.png'}
										alt={notification.user.username}
										className="w-6 h-6 rounded-full object-cover"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<div className="font-irish text-white text-xs font-medium truncate">
										{notification.user.username}
									</div>
									<div className="text-xs text-white/80">
										{getNotificationText(notification)}
									</div>
									<div className="text-xs text-white/60">
										{new Date(notification.createdAt).toLocaleDateString()}
									</div>
								</div>
							</div>
							{renderActionButton(notification)}
						</li>
					))}
				</ul>
			</div>

			{notifications.length > 3 && (
				<div className="p-2 border-t border-[#4E92A2] bg-[#5D9FA9]/50 rounded-b-lg">
					<button
						onClick={(e: MouseEvent) => {
							e.preventDefault();
							e.stopPropagation();
							setShowAll(prev => !prev);
						}}
						className="w-full px-4 py-2  text-sm text-[#62CEF5] font-medium hover:underline transition-colors duration-200"
					>
						{showAll ? 'See less notifications' : 'See more notifications'}
					</button>
				</div>
			)}
		</div>
	);
};

interface NotificationButtonProps {
	modalManager: {
		activeModal: 'search' | 'notification' | null;
		openModal: (modal: 'search' | 'notification') => void;
		closeModal: () => void;
		isModalOpen: (modal: 'search' | 'notification') => boolean;
	};
}

export const NotificationButton: ComponentFunction<NotificationButtonProps> = ({ modalManager }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [redpoint, setredpoint] = useState<Boolean>(false);


	ws.onmessage = (ev) => {
		setredpoint(ev.data == "start");
	}

	const showNotif = modalManager.isModalOpen('notification');

	const handleButtonClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (showNotif) {
			modalManager.closeModal();
		} else {
			modalManager.openModal('notification');
		}
	};


	useEffect(() => {
		if (!showNotif) return;

		const handleClickOutside = (e: Event) => {
			const target = e.target as Element;

			if (containerRef.current && !containerRef.current.contains(target)) {
				modalManager.closeModal();
			}
		};

		const timeoutId = setTimeout(() => {
			document.addEventListener('click', handleClickOutside, true);
		}, 50);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('click', handleClickOutside, true);
		};
	}, [showNotif, modalManager]);

	return (
		<div className="relative" ref={containerRef}>
			<button
				type="button"
				onClick={(e: MouseEvent) => { handleButtonClick(e); setredpoint(false) }}
				className="flex items-center gap-2 md:px-3 py-1 overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95"
			>
				<img src="/images/home-assests/notif-icon.svg" alt="notif" className="w-6 h-6 md:w-10 md:h-10" />
				{
					redpoint && (
						<span className="absolute top-2 right-4 block w-3 h-3 bg-red-600 border-2 border-white rounded-full animate-ping"></span>
					)
				}
			</button>
			<NotificationPanel modalManager={modalManager} open={showNotif} />
		</div>
	);
};
