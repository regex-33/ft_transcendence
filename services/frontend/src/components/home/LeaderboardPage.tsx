import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { Header } from './Header';
import { useState } from '../../hooks/useState';
import { useEffect } from '../../hooks/useEffect';
import { Online } from '../chat_front/online';




export const Leaderboard: ComponentFunction = () => {
      const [isAuthenticated, setIsAuthenticated] = useState(false);
      const [loading, setLoading] = useState(true);
     
  interface Friend { id: number; name: string; image: string; online?: boolean; }
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    
      useEffect(() => {
        const checkAuth = async () => {
          try {
            const response = await fetch(
              `http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/get/me`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: 'include',
              }
            );
    
            if (response.ok) 
            {
              setIsAuthenticated(true);
            } 
            else 
            {
              window.history.pushState({}, "", `/login`);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
          } catch (err) {
            window.history.pushState({}, "", `/login`);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
          finally {
            setLoading(false);
          }
        };
    
        checkAuth();
      }, []);

      useEffect(() => {
        if (!isAuthenticated) return;
        const fetchFriends = async () => {
          try {
            const response = await fetch('/api/friends/friends', {
              credentials: 'include',
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
              throw new Error(`Failed to fetch friends: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const mapped = Array.isArray(data)
              ? data.map((f: any) => ({
                  id: Number(f.id),
                  name: String(f.username ?? ''),
                  image: String(f.avatar ?? '/images/default-avatar.png'),
                  online: Boolean(f.online),
                }))
              : [];
            setFriends(mapped);
          } catch (err) {
            console.error('Error fetching friends:', err);
            setFriends([]);
          }
        };
        fetchFriends();
      }, [isAuthenticated]);
      
      if (loading) {
        return <div className="text-white p-4">Checking authentication...</div>;
      }
   if (isAuthenticated)
      {
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
          <div className="relative h-[calc(100vh-72px)]">
            <Online data_friend={friends} name_friend={setSelectedFriend} />
            <div
              className="absolute top-5% left-7% right-7% h-90%  overflow-hidden"
            >
              <div className="w-full flex flex-col items-center">
                <div className="w-[500px] h-[250px] flex flex-col items-center justify-center text-center ">
                          <h2 className="text-white translate-y-[40px]">Ranking of players by Wins</h2>
                          <img src="/images/home-assests/leaderboard_kass.svg" alt="trophy" className="w-[55%] min-w-[60px] h-auto mt-0" />
                  </div>

                <div className="w-full absolute top-25% h-50% flex-col items-center justify-center ">
                  <div className="ml-60 flex justify-center w-[200px] h-[50px]">
                    <img src="/images/home-assests/leaderboard_button.svg" alt="Leaderboard" className="w-full h-full object-contain" />
                </div>
                  <div className=" w-70% h-[450px] rounded-2xl bg-sky-custom/20 border border-white/50 overflow-hidden  mx-auto">
                    <ul className="flex flex-col gap-3">
                  
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <div />;
};