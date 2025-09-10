import { Search } from "./Search";
import { NotificationButton } from './Notif';
import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useEffect } from "../../hooks/useEffect";



export const Header: ComponentFunction = () => {
  
  const handleLogout = async () => {
    try {
      await fetch(
        `http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/logout`,
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


     
      <div className="hidden sm:flex items-center justify-around w-1/2  md:px-2 h-[64px] relative left-12 top-1">
        <nav className="flex gap-3 md:gap-3 flex-none justify-center mr-[180px] min-w-0">

        
          <NotificationButton />
      

        <div className="min-w-0" >
          <button className="flex items-center gap-2   md:px-3 py-1    overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95">
          <a  onClick={handleSettingsClick}>
          <img src="/images/home-assests/setting-icon.svg" alt="settings" />
        </a>
          </button>
        </div>

          <div className="relative min-w-0">
          <button className="flex items-center gap-2   md:px-3 py-1    overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95 ">
            <img src="/images/home-assests/chat-icon.svg" alt="chat" className="w-6 h-6 md:w-10 md:h-10" />
          </button>
          <span className="absolute top-3 right-5 block h-[6px] w-[6px] rounded-full bg-red-500 transition-transform duration-200 hover:scale-95 "></span>
        </div>

        <Search />
        
        <div className="min-w-0">
          <button className="flex items-center gap-2   md:px-3 py-1    overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95">
            <img src="/images/home-assests/game-icon.svg" alt="game" className="w-6 h-6 md:w-10 md:h-10" />
          </button>
        </div>
        </nav>

        <div className="min-w-0">
          <button
            onClick={handleLogout}
           className="flex items-center gap-2    py-1   ml-28 overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95">
            <img src="/images/home-assests/logout-icon.svg" alt="logout" className="w-6 h-6 md:w-10 md:h-10" />
          </button>
        </div>
        
      </div>
      {/* <div className="sm:hidden z-10">
        <button className="flex items-center gap-2 border px-2 py-1 rounded hover:bg-[#427970]">
          <img src="/images/home-assests/menu-icon.svg" alt="menu" className="w-6 h-6" />
        </button>
      </div> */}
    </header>
)
}
