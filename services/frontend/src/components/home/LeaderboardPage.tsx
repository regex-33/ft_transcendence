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

  const LeaderboardTop5users = [
    {
      id: 1,
      avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
      name: "YOUSSEF",
      wins: 100,
      online:true,
      me: false
    },
    {
      id: 2,
      avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
      name: "oussama",
      wins: 60,
      online:true,
      me: false
    },
    {
      id: 3,
      avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
      name: "ALI",
      wins: 30,
      online:false,
      me: false
    },
    {
      id: 4,
      avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
      name: "khalid",
      wins: 20,
      online:false,
      me: false
    },
    {
      id: 5,
      avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg",
      name: "HAMZA",
      wins: 8,
      online:true,
      me:true
    }
  ];

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
            <Online data_friend={friends} name_friend={setSelectedFriend} />
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
                    <ul className="flex flex-col gap-3 p-4">
                      {LeaderboardTop5users.map((user, index) => (
                      <div className="flex items-center gap-4">
                        {/* Profile Avatar */}
                        <div className="relative w-16 h-16 flex-shrink-0 transition-transform duration-200 hover:scale-95"
                        onClick={(e: Event) => handleProfileClick(user.name, e)}>
                          <img
                            src={user.online ? '/images/home-assests/cir-online.svg' : '/images/home-assests/cir-offline.svg'}
                            alt={user.online ? 'Online' : 'Offline'}
                            className="absolute inset-0 w-full h-full"
                          />
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-14 h-14 rounded-full border-2 border-white/50 absolute inset-0 m-auto"
                          />
                        </div>
                        {/* content */}
                        <li
                          key={user.id}
                          className={`grid grid-cols-[1fr_auto_1fr] items-center p-4 rounded-full ${
                            user.me ? 'bg-[#4EBDE6]' : 'bg-[#AE9C8C]'
                          } backdrop-blur-sm w-full`}
                        >
                          <span className="text-white font-semibold text-lg justify-self-start">{user.name}</span>

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