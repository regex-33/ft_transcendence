import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';

type Friend = {
  id: number;
  username: string;
  avatar: string;
  online: boolean;
  status: 'pending' | 'blocked' | 'friend';
};

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export const FriendsSettings: ComponentFunction = () => {
  const [sortBy, setSortBy] = useState<'all' | 'friend' | 'pending' | 'blocked'>('all');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users`);

      if (!response.ok) {
        throw new Error('Failed to fetch users data');
      }

      const allUsers = await response.json();
      const friendsWithRelationships: Friend[] = allUsers
        .filter((user: any) => user.status !== null)
        .map((user: any) => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          online: user.online,
          status: user.status
        }));

      setFriends(friendsWithRelationships);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFriendAction = async (username: string, action: 'accept' | 'cancel' | 'block' | 'unblock') => {
    try {
      const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, action })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} friend`);
      }

      await fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(`Error performing ${action} action:`, err);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const filteredFriends =
    sortBy === 'all'
      ? friends
      : friends.filter(f => f.status === sortBy);
  const friendColumns = chunk(filteredFriends, 2);
  function getActionButtons(friend: { id: number; username: string; avatar: string; status: string; }) {
    if (friend.status === "friend") {
      return (
        <div className="flex gap-2">
          <button 
            onClick={() => handleFriendAction(friend.username, 'cancel')}
            className="
            flex items-center gap-2 px-4 h-[30px]
            bg-[url('/images/setting-assests/bg-unfriend.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-sm
            transition-transform duration-200 hover:scale-95 
          ">
            <i className="fa-solid fa-user-xmark text-sm"></i>
            <span>Unfriend</span>
          </button>
          <button 
            onClick={() => handleFriendAction(friend.username, 'block')}
            className="
            flex items-center gap-2 px-4 h-[30px]
            bg-[url('/images/setting-assests/bg-block.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-sm
            transition-transform duration-200 hover:scale-95 
          ">
            <i className="fa-solid fa-ban text-sm"></i>
            <span>Block</span>
          </button>
        </div>
      );
    } else if (friend.status === "pending") {
      return (
        <div className="flex gap-2">
          <button 
            onClick={() => handleFriendAction(friend.username, 'accept')}
            className="
            flex items-center gap-2 px-4 h-[30px]
            bg-[url('/images/setting-assests/bg-accept.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-sm
            transition-transform duration-200 hover:scale-95 
          ">
            <i className="fa-solid fa-check text-sm"></i>
            <span>Accept</span>
          </button>
          <button 
            onClick={() => handleFriendAction(friend.username, 'cancel')}
            className="
            flex items-center gap-2 px-4 h-[30px]
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
    } else if (friend.status === "blocked") {
      return (
        <button 
          onClick={() => handleFriendAction(friend.username, 'unblock')}
          className="
          flex items-center gap-2 px-4 h-[30px]
          bg-[url('/images/home-assests/bg-unbloc.svg')]
          bg-no-repeat bg-center bg-contain
          text-white font-semibold text-sm
          transition-transform duration-200 hover:scale-95 
        ">
          <i className="fa-solid fa-user-xmark text-xs"></i>
          <span>Unblock</span>
        </button>
      );
    }
    
    return null;
  }

  if (loading) {
    return (
      <div className="h-[700px] max-w-[1400px] bg-[#91BFBF] bg-opacity-85 mr-auto mt-12 rounded-xl p-6 pt-12 flex items-center justify-center">
        <div className="text-white text-xl">Loading friends...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[700px] max-w-[1400px] bg-[#91BFBF] bg-opacity-85 mr-auto mt-12 rounded-xl p-6 pt-12 flex items-center justify-center">
        <div className="text-red-300 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div
      className="h-[700px] max-w-[1400px] bg-[#91BFBF] bg-opacity-85 mr-auto mt-12 rounded-xl p-6 pt-12 overflow-x-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#64B0C5 transparent',
        scrollbarHeight: 'hidden',
      }}>
      <div className="fixed -mt-9 w-[120px] h-[30px]"
        style={{
          backgroundImage: "url('/images/setting-assests/bg-SortBy.svg')",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          borderRadius: '10px',
        }}>
        <select
          value={sortBy}
          onChange={(e: Event) => setSortBy((e.target as HTMLSelectElement).value as 'all' | 'friend' | 'pending' | 'blocked')}
          className="w-full h-full bg-transparent text-white font-luckiest text-base appearance-none pl-6 pt-1 focus:outline-none cursor-pointer"
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
          }}
        >
          <option value="all" className="bg-[#5E9CAB] text-white rounded-2xl">All</option>
          <option value="pending" className="bg-[#5E9CAB] text-white rounded-2xl">Pending</option>
          <option value="friend" className="bg-[#5E9CAB] text-white rounded-2xl">Friends</option>
          <option value="blocked" className="bg-[#5E9CAB] text-white rounded-2xl">Blocked</option>
        </select>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="flex gap-7 p-4" style={{ minWidth: 'max-content' }}>
          {friendColumns.map((group, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-4 items-center min-w-[60px] flex-shrink-0">
              {group.map((friend, friendIdx) => 
                <div
                  key={friend.id}
                  className="w-[340px] h-[285px] bg-no-repeat bg-center p-4 relative"
                  style={{ backgroundImage: "url('/images/setting-assests/bg-friends.svg')" }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    
                    <div className="relative w-[100px] h-[100px] flex-shrink-0 mt-10">
                      {friend.status === 'friend' ? (
                        <div
                          className="relative w-24 h-24 flex items-center justify-center bg-no-repeat bg-contain"
                          style={{
                            backgroundImage: friend.online
                              ? 'url("/images/home-assests/cir-online.svg")'
                              : 'url("/images/home-assests/cir-offline.svg")'
                          }}
                        >
                          <img
                            src={friend.avatar}
                            className="w-[70px] h-[70px] rounded-full object-cover relative"
                            alt="Avatar"
                          />
                        </div>
                      ) : (
                        <img
                          src={friend.avatar}
                          className="w-full h-full rounded-full object-cover border-4 border-white/30"
                          alt="Avatar"
                        />
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{friend.username}</h3>
                    <div className="flex flex-row items-center gap-2">
                      <div className="">
                        {getActionButtons(friend)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
