import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { Header } from './Header';
import { useState } from '../../hooks/useState';
import { useEffect } from '../../hooks/useEffect';
import { Online } from '../chat_front/online';

interface LeaderboardUser {
  id: number;
  avatar: string;
  username: string;
  wins: number;
  online: boolean;
}

interface Friend {
  id: number;
  username: string;
  avatar?: string;
  online?: boolean;
  name: string;
  image: string;
}

export const Leaderboard: ComponentFunction = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [me, setMe] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
    
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users/get/me`,
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
          const data = await response.json();
          setMe(data);
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

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!isAuthenticated) return;
      
      setLeaderboardLoading(true);
      setLeaderboardError('');
      
      try {
        const response = await fetch(`${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/player/leaderboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data: LeaderboardUser[] = await response.json();
          setLeaderboardData(data || []);
        } else {
          throw new Error('Failed to fetch Leaderboard data');
        }
      } catch (error) {
        setLeaderboardError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isAuthenticated]);

  // Fetch friends data
  useEffect(() => {
    const fetchFriends = async () => {
      if (!isAuthenticated) return;
      
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
        setFriends(data);
      } catch (err) {
        console.error('Error fetching friends:', err);
      } 
    };
    
    if (isAuthenticated) {
      fetchFriends();

      // Refresh friends every 5 seconds
      const intervalId = setInterval(() => {
        fetchFriends();
      }, 5000);

      // Cleanup function to clear interval when component unmounts
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isAuthenticated]);

  const handleProfileClick = (username: string, e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    window.history.pushState({}, "", `/profile/${username}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
 
  const renderStars = (index: number) => {
    const starCount = Math.max(5 - index, 1);
    return Array.from({ length: starCount }, (_, i) => (
      <img
        key={i}
        src="/images/home-assests/stars.svg"
        alt="star"
        className="w-11 h-11"
      />
    ));
  };
      
  if (loading) {
    return <div className="text-white p-4">Checking authentication...</div>;
  }
  
  if (isAuthenticated) {
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
        
        <div className="relative z-10 ">
          <Header />
          <div className="relative h-[calc(100vh-72px)]">
            <div>
              <div
                className="absolute top-14% inset-0 bg-sky-custom/35 w-5% h-82%  rounded-lg object-cover  mx-1% overflow-y-auto"  
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#659EAC transparent',
                  msOverflowStyle: 'auto',
                }}
              >
                <Online 
                  friends={friends.filter(friend => friend.online)} 
                  position="left"        
                />
              </div>
              <img src='images/chat/icon_online.png' alt="icon online" className=" absolute top-12% mx-4% h-2.5% w-1.5% "></img>
              <div
                className="absolute top-14% right-0 bg-sky-custom/35 w-5% h-82%  rounded-lg object-cover  mx-1% overflow-y-auto"  
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4D8995 transparent',
                  msOverflowStyle: 'auto',
                }}
              >
                <Online 
                  friends={friends.filter(friend => friend.online)}         
                  position="right"     
                />
              </div>
              <img src='images/chat/icon_online.png' alt="icon online" className=" absolute top-12% mx-97% h-2.5% w-1.5%"></img>
            </div>
            <div className="absolute top-5% left-7% right-7% h-90% overflow-hidden">
              <div className="w-full flex flex-col items-center">
                <div className="w-[500px] h-[250px] flex flex-col items-center justify-center text-center">
                  <h2 className="text-white translate-y-[40px]">Ranking of players by Wins</h2>
                  <img src="/images/home-assests/leaderboard_kass.svg" alt="trophy" className="w-[55%] min-w-[60px] h-auto mt-0" />
                </div>

                <div className="w-full absolute top-25% h-50% flex-col items-center justify-center">
                  <div className="ml-60 flex justify-center w-[200px] h-[50px]">
                    <img src="/images/home-assests/leaderboard_button.svg" alt="Leaderboard" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-70% h-[450px] rounded-2xl bg-sky-custom/20 border border-white/50 overflow-hidden mx-auto">
                    {leaderboardLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-white text-lg">Loading leaderboard...</div>
                      </div>
                    ) : leaderboardError ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-red-500 text-2xl mb-4">{leaderboardError}</div>
                      </div>
                    ) : leaderboardData.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-white">
                          <p className="text-lg mb-2">No leaderboard data yet</p>
                          <p className="text-sm text-gray-400">Play some games to see the leaderboard!</p>
                        </div>
                      </div>
                    ) : (
                      <ul className="flex flex-col gap-3 p-4">
                        {leaderboardData.map((user, index) => (
                          <div key={user.id} className="flex items-center gap-4">
                            {/* Profile Avatar */}
                            <div 
                              className="relative w-16 h-16 flex-shrink-0 transition-transform duration-200 hover:scale-95 cursor-pointer"
                              onClick={(e: Event) => handleProfileClick(user.username, e)}
                            >
                              <img
                                src={user.online ? '/images/home-assests/cir-online.svg' : '/images/home-assests/cir-offline.svg'}
                                alt={user.online ? 'Online' : 'Offline'}
                                className="absolute inset-0 w-full h-full"
                              />
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-14 h-14 rounded-full border-2 border-white/50 absolute inset-0 m-auto object-cover"
                              />
                            </div>
                            {/* content */}
                            <li
                              className={`grid grid-cols-[1fr_auto_1fr] items-center p-4 rounded-full ${
                                user.username === me?.username ? 'bg-[#4EBDE6]' : 'bg-[#AE9C8C]'
                              } backdrop-blur-sm w-full`}
                            >
                              <span className="text-white font-semibold text-lg justify-self-start">{user.username}</span>

                              <div className="justify-self-start w-[300px]">
                                <div className="flex items-center gap-1 ">
                                  {renderStars(index)}
                                </div>
                              </div>
                              <span className="text-white font-bold text-lg min-w-[60px] justify-self-end text-right">
                                {user.wins}
                              </span>
                            </li>
                          </div>
                        ))}
                      </ul>
                    )}
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