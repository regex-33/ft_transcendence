import { Search } from "./Search";
import { NotificationButton } from './Notif';
import { useModalManager } from './ModalManager';
import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useEffect } from "../../hooks/useEffect";
import { Bchat } from "../chat_front/Bchat";
import { useState } from '../../hooks/useState';


export const Header: ComponentFunction = () => {
  const modalManager = useModalManager();
  const [hasNotif, setHasNotif] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const resUser = await fetch('${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/chat/me', {
          credentials: 'include',
          method: "GET",
        });
        if (!resUser.ok) 
          throw new Error('Cannot fetch user');
        const user = await resUser.json();
        setUserId(user.id);
        localStorage.setItem('userId', user.id);
        console.log("data user for notif is : ", user);
      } catch (error) {
        console.log("Fixi hadi namoussa had error is : ", error);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const notificationSocket = new WebSocket('ws://localhost:8002/ws/chat');

    notificationSocket.onopen = () => {
      console.log("Notification WebSocket connected");
      notificationSocket.send(JSON.stringify({ type: 'notification', id: userId }));
    };

    notificationSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.notif === true) {
        console.log("ja message jdid");
        setHasNotif(true);
      }
    };

    return () => {
      notificationSocket.close();
    };
  }, [userId]);
  const handleLogout = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/logout`,
        { 
          credentials: "include",
        }
      );
        window.history.pushState({}, '', `/login`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    } 
    catch (error) 
    {
      console.error("Logout failed:", error);
      window.history.pushState({}, '', `/login`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleSettingsClick = (e: Event) => {
    e.preventDefault();
    window.history.pushState({}, '', '/settings');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleChatClick = (e: Event) => {
    e.preventDefault();
    window.history.pushState({}, '', '/Chat-Friend');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
   const handleLeaderboardClick = (e: Event) => {
    e.preventDefault();
    window.history.pushState({}, '', '/Leaderboard');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  
  return (
    <header
    className="relative flex justify-between items-center py-3 shadow-md text-white"
      style={{ backgroundColor: 'rgba(94, 156, 171, 0.6)' }}
    >
    
    <div className="absolute inset-0 z-0 flex items-end justify-center pointer-events-none">
  <img
    src="/images/home-assests/pol-header.png"
    alt="Background"
    className="absolute bottom-0 left-1/2 -translate-x-1/2 max-h-full max-w-full object-contain opacity-55"
  />
</div>

    
                <a href="/home" className="relative z-10 flex items-center left-4 space-x-1">
                  <img src="/images/home-assests/logo.png" alt="logo" className="w-13 h-[62px]" />
                  <h2 className="text-xl font-semibold">The Game</h2>
                </a>


      <div className="hidden sm:flex items-center justify-around w-1/2  md:px-2 h-[64px]  relative left-12 top-1">
        <nav className="flex gap-3 md:gap-3 flex-none justify-center mr-[180px] min-w-0">

        
          <NotificationButton modalManager={modalManager} />
      

        <div className="min-w-0" >
          <button className="flex items-center gap-2   md:px-3 py-1    overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95">
          <a  onClick={handleSettingsClick}>
          <img src="/images/home-assests/setting-icon.svg" alt="settings" />
        </a>
          </button>
        </div>
          {/* <Bchat/> */}
          <div className="relative min-w-0">
          <button className="flex items-center gap-2   md:px-3 py-1    overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95 ">
          <a  onClick={handleChatClick}>
            <img src="/images/home-assests/chat-icon.svg" alt="chat" className="w-6 h-6 md:w-10 md:h-10" />
          </a>
          {hasNotif && (
               <span className="absolute top-2 right-4 block w-3 h-3 bg-red-600 border-2 border-white rounded-full animate-ping"></span>
            )}
          </button>
        </div>

        <Search modalManager={modalManager} />
        
        <div className="min-w-0">
          <button className="flex items-center gap-2   md:px-3 py-1    overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95">
            <img src="/images/home-assests/game-icon.svg" alt="game" className="w-6 h-6 md:w-10 md:h-10" />
          </button>
        </div>
        <div className="min-w-0">
           <a  onClick={handleLeaderboardClick}>
          <button className="flex items-center gap-2   md:px-3 py-0  -mt-[2px]  overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95">
            <img src="/images/home-assests/leaderboard-icon.svg" alt="leaderboard" className="w-10 h-10 md:w-[55px] md:h-[55px]" />
          </button>
          </a>
        </div>
        </nav>
        <div className="min-w-0">
          <button
            onClick={handleLogout}
           className="flex items-center gap-2    py-1   ml-25 overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95">
            <img src="/images/home-assests/logout-icon.svg" alt="logout" className="w-6 h-6 md:w-10 md:h-10" />
          </button>
        </div>
        
      </div>
    </header>
)
}