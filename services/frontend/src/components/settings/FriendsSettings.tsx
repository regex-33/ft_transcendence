import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';


type Friend = {
  id: number;
  name: string;
  avatar: string;
  status: 'accepted' | 'pending' | 'blocked';
};

const friends: Friend[] = [
     { id: 1, name: 'yous', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'blocked' },
    { id: 2, name: 'ssef', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'accepted' },
    { id: 3, name: 'GUY', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'pending' },
];
function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
export const FriendsSettings: ComponentFunction = () => {
  const [sortBy, setSortBy] = useState<'all' | 'accepted' | 'pending' | 'blocked'>('all');
  const filteredFriends =
    sortBy === 'all'
      ? friends
      : friends.filter(f => f.status === sortBy);
  const friendColumns = chunk(filteredFriends, 2);
 


  function getStatusColor(status: string) {
    switch (status) {
      case 'accepted':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  }
  function getActionButtons(friend: { id: number; name: string; avatar: string; status: string; }) {
    if (friend.status === "accepted") {
      return (
        <div className="flex gap-2">
          <button className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-1 rounded-full h-[28px] hover:bg-blue-600 transition">
            <i className="fa-solid fa-user-xmark text-sm"></i>
            Unfriend
          </button>
          <button className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-1 rounded-full h-[28px] hover:bg-red-600 transition">
            <i className="fa-solid fa-ban text-sm"></i>
            Block
          </button>
        </div>
      );
    } else if (friend.status === "pending") {
      return (
        <div className="flex gap-2">
          <button className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-1 rounded-full h-[28px] hover:bg-green-600 transition">
            <i className="fa-solid fa-check text-sm"></i>
            Accept
          </button>
          <button className="flex items-center justify-center gap-2 bg-cyan-500 text-white px-4 py-1 rounded-full h-[28px] hover:bg-cyan-600 transition">
            <i className="fa-solid fa-xmark text-sm"></i>
            Decline
          </button>
        </div>
      );
    } else if (friend.status === "blocked") {
      return (
        <button className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-1 rounded-full h-[28px] hover:bg-gray-600 transition">
          <i className="fa-solid fa-user-xmark text-sm"></i>
          Unblock
        </button>
      );
    }
    
       
    return null;
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
    onChange={(e: Event) => setSortBy((e.target as HTMLSelectElement).value as Friend['status'] | 'all')}
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
    <option value="accepted" className="bg-[#5E9CAB] text-white rounded-2xl">Accepted</option>
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
                    className="w-[340px] h-[285px] bg-no-repeat bg-center  p-4 relative"
                    style={{ backgroundImage: "url('/images/setting-assests/bg-friends.svg')" }}
                  >
            <div className="flex flex-col items-center justify-center h-full">
               <div className="relative w-[100px] h-[100px] flex-shrink-0 mb-4">
                    <img
                        src={friend.avatar}
                        className="w-full h-full rounded-full object-cover border-4 border-white/30"
                        alt="Avatar"
                    />
                  </div>
              <h3 className="text-lg font-bold text-white mb-2">{friend.name}</h3>
              <div className="flex flex-row items-center gap-2">
                {/* <button className={`text-sm text-white px-3 py-1 bg-opacity-75 rounded-full w-24 h-[28px] ${getStatusColor(friend.status)}`}>
                  {friend.status}
                </button> */}
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
