import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';
import { useRef } from '../../hooks/useRef';
import { ws } from '../../main'

type NotificationType = 'MATCH_NOTIFICATION' | 'FRIEND_REQUEST';

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
      const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/notifications`, 
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
      const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/actions`, {
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
  const handleMatchAction = async (username: string, action: 'accept' | 'refuse') => {
    try {
      const response = await fetch('/api/action_match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, action })
      });

      if (!response.ok) throw new Error(`Failed to ${action} match`);

      await fetchNotifications();
    } catch (err) {
      console.error(`Error performing ${action} match action:`, err);
    }
  };

  const renderActionButton = (notification: Notification) => {
    if (notification.type === 'FRIEND_REQUEST') {
      return (
       <div className="flex gap-1">
          <button 
            onClick={() => handleFriendAction(notification.user.username, 'accept')}
            className="
            flex items-center gap-1 px-4 h-[25px]
            bg-[url('/images/setting-assests/bg-accept.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-sm
            transition-transform duration-200 hover:scale-95 
          ">
            <i className="fa-solid fa-check text-sm"></i>
            <span>Accept</span>
          </button>
          <button 
            onClick={() => handleFriendAction(notification.user.username, 'cancel')}
            className="
            flex items-center gap-1 px-4 h-[25px]
            bg-[url('/images/setting-assests/bg-decline.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-sm
            transition-transform duration-200 hover:scale-95 
          ">
            <i className="fa-solid fa-xmark text-sm"></i>
            <span>Decline</span>
          </button>
        </div>
      );
    }

    if (notification.type === 'MATCH_NOTIFICATION' && notification.gameId) {
      return (
        <div className="flex gap-1">
          <button 
            onClick={() => handleMatchAction(notification.user.username, 'accept')}
            className="
            flex items-center gap-1 px-4 h-[25px]
            bg-[url('/images/setting-assests/bg-accept.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-sm
            transition-transform duration-200 hover:scale-95 
          ">
            <i className="fa-solid fa-table-tennis-paddle-ball text-red-500 text-sm"></i>
            <span>Play match</span>
          </button>
          <button 
            onClick={() => handleMatchAction(notification.user.username, 'refuse')}
            className="
            flex items-center gap-1 px-4 h-[25px]
            bg-[url('/images/setting-assests/bg-decline.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-sm
            transition-transform duration-200 hover:scale-95 
          ">
            <i className="fa-solid fa-xmark text-sm"></i>
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
        <div className="mt-3">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full shadow-md border border-white/30">
            <span className="text-sm font-medium text-white">
              ALL {totalCount}
            </span>
          </div>
        </div>
      </div>

      <div className={`flex-1 ${showAll ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <ul className="space-y-3 p-3 overflow-x-auto overflow-y-hidden"
          style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#64B0C5 transparent',
              msOverflowStyle: 'auto',
            }}>
          {displayNotifications.map((notification, index) => (
            <li
              key={`${notification.notifierId}-${notification.type}-${index}`}
              className="flex items-center justify-between gap-3 pb-1 border-b 
                border-[#91C7D6] "
            
            >
              <div className="flex items-center gap-3 flex-1">
               <div
          key={notification.user.id}
          className="relative w-10 h-10 flex items-center 
                          justify-center bg-no-repeat bg-contain transition-transform duration-200 hover:scale-95"
           style={{
                 backgroundImage: 'url("/images/home-assests/cir-online.svg")',
                  }}
        >
          <img
            src={notification.user.avatar || '/images/default-avatar.png'}
            alt={notification.user.username}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
                <div className="flex-1">
                  <div className="w-[100px]">
                    <span className="font-irish text-white">{notification.user.username}</span>
                    </div>
                  <div className="text-sm text-white/80">{getNotificationText(notification)}</div>
                  <div className="text-xs text-white/60">
                    {new Date(notification.createdAt).toLocaleDateString()}
                    {/* <span>{notification.createdAt}</span> */}
                  </div>
                </div>
              </div>
              {renderActionButton(notification)}
            </li>
          ))}
        </ul>
      </div>

      {notifications.length > 3 && (
        <div className="p-3 border-t border-[#4E92A2] bg-[#5D9FA9]/50 rounded-b-lg">
          <button
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAll(prev => !prev);
            }}
            className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg shadow-md border border-white/30 text-sm text-white font-medium hover:bg-white/30 transition-colors duration-200"
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