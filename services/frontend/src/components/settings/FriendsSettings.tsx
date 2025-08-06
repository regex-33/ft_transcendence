import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';


const friends = [
     { id: 1, name: 'yous', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'blocked' },
    { id: 2, name: 'ssef', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'accepted' },
    { id: 3, name: 'ANDE', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'blocked' },
    { id: 4, name: 'GUY', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'pending' },
    { id: 5, name: 'LUN', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'accepted' },
    { id: 6, name: 'ANDE', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'pending' },
    { id: 7, name: 'SARA', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'accepted' },
    { id: 8, name: 'MIKE', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'blocked' },
    { id: 9, name: 'EMMA', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'pending' },
    { id: 10, name: 'ALEX', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'accepted' },
    { id: 11, name: 'ZARA', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'pending' },
    { id: 12, name: 'NOAH', avatar: "https://cdn.intra.42.fr/users/1b0a76a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'blocked' }
];
const FriendItem: ComponentFunction = (props = {}) => {
  const friend = props.friend as typeof friends[0];
  return (
    <div>
      <div className="flex flex-col items-center">
        <img
          src={friend.avatar}
          alt={friend.name}
          className="w-16 h-16 rounded-full mb-2"
      />
      <span className="text-sm font-semibold">{friend.name}</span>
      <span className={`text-xs ${friend.status === 'accepted' ? 'text-green-500' : friend.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
        {friend.status}
      </span>
    </div>
    </div>
  );
}
function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
export const FriendsSettings: ComponentFunction = () => {
const friendColumns = chunk(friends, 2);

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
    if (friend.status === 'accepted') {
      return (
        <button className="bg-red-500 text-sm text-white px-3 py-1 w-24 h-[28px] rounded-full hover:bg-red-600 transition">
          Block
        </button>
      );
    } else if (friend.status === 'pending') {
      return (
        <div className="flex gap-2">
          <button className="bg-[#4BC98A] text-white px-3 py-1 rounded-full w-24 h-[28px]  hover:bg-[#4BC98A] transition">
            Accept
          </button>
          <button className="bg-[#39A4C7] text-white px-3 py-1 rounded-full w-24 h-[28px]  hover:bg-gray-500 transition">
            Decline
          </button>
        </div>
      );
    } else if (friend.status === 'blocked') {
      return (
        <button className="bg-[#858895] text-white px-3 py-1 rounded-full w-24 h-[28px]  hover:bg-blue-600 transition">
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
      }}>
      <div className="grid grid-cols-4 gap-4">
        <div className="flex gap-7 p-4" style={{ minWidth: 'max-content' }}>
          {friendColumns.map((group, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-4 items-center min-w-[60px] flex-shrink-0">
              {group.map((friend, friendIdx) => 
                    <div
                    key={friend.id}
                    className="w-[340px] h-[300px] bg-no-repeat bg-center  p-4 relative"
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
                <button className={`text-sm text-white px-3 py-1 rounded-full w-24 h-[28px] ${getStatusColor(friend.status)}`}>
                  {friend.status}
                </button>
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
