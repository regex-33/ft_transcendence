import { useEffect } from "../../hooks/useEffect";
import { useRef } from "../../hooks/useRef";
import { useState } from "../../hooks/useState";
import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import Xo from "./xo/Xo";

interface Friend {
  id: number;
  username: string;
  avatar: string;
  online: boolean;
}

const FriendItem: ComponentFunction = (props = {}) => {
  const friend = props.friend as Friend;
  const cadreBg = friend.online ? "/images/home-assests/cir-online.svg" : "/images/home-assests/cir-offline.svg";
  return (
    <div className="flex flex-row items-center w-16 translate-y-14">
      <div 
        className="w-20 h-20 relative flex items-center justify-center bg-no-repeat bg-contain"
        style={{ backgroundImage: `url(${cadreBg})` }}
      >
        <img
          src={friend.avatar}
          alt="Friend Avatar"
          className="w-12 h-12 rounded-full object-cover relative -top-[7px]"
        />
      </div>
    </div>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export const ChatPanel: ComponentFunction = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  // const [loading, setLoading] = useState<boolean>(true);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/friends`,
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
    fetchFriends();

    //every 5 seconds
    const intervalId = setInterval(() => {
      fetchFriends();
    }, 5000);

    // Cleanup function to clear interval when component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const friendColumns = chunk(friends, 2);
  if (friends.length === 0) 
    {
    return (
      <aside className="w-[25%] p-2 flex flex-col gap-4">
        <div className="relative w-full">
          <button
            className="h-[50px] w-[260px] py-2 bg-no-repeat bg-contain 
              bg-center text-white relative left-16 top-3"
            style={{ backgroundImage: "url('/images/home-assests/bg-gameMode.svg')" }}
          >
            <span className="font-irish font-bold tracking-wide text-sm sm:text-base md:text-2xl">
              No Friends Online
            </span>
          </button>
          <div
            className="relative rounded-lg h-[320px] w-[340px]
              bg-no-repeat bg-center bg-[length:340px_330px] translate-x-7 overflow-hidden
              flex items-center justify-center"
            style={{ backgroundImage: "url('/images/home-assests/bg-online.svg')" }}
          >
            <div className="text-white text-center">
              <p>No friends found</p>
            </div>
          </div>
        </div>
        <Xo />
      </aside>
    );
  }


  return (
    <aside className="w-[25%] p-2 flex flex-col gap-4">
      <div className="relative w-full">
        <button
          className="h-[50px] w-[260px] py-2 bg-no-repeat bg-contain 
            bg-center text-white relative left-16 top-3"
          style={{ backgroundImage: "url('/images/home-assests/bg-gameMode.svg')" }}
        >
          <span className="font-irish font-bold tracking-wide text-sm sm:text-base md:text-2xl">
            Friends Online
          </span>
        </button>
        <div
          className="relative rounded-lg h-[320px] w-[340px]
            bg-no-repeat bg-center bg-[length:340px_330px] translate-x-7 overflow-hidden"
          style={{ backgroundImage: "url('/images/home-assests/bg-online.svg')" }}
        >
          <div
            className="absolute inset-0 ml-4 pr-4 max-w-[300px] overflow-x-auto overflow-y-hidden "
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#64B0C5 transparent',
              msOverflowStyle: 'auto',
            }}
          >
            <div className="flex gap-7 p-4" style={{ minWidth: 'max-content' }}>
              {friendColumns.map((group, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-4 items-center min-w-[60px] flex-shrink-0">
                  {group.map((friend, friendIdx) => 
                    <FriendItem key={friend.id || `friend-${idx}-${friendIdx}`} friend={friend} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Xo />
    </aside>
  );
}