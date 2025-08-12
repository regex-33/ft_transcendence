import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';

export const FriendsSettings: ComponentFunction = () => {
  const [sortBy, setSortBy] = useState('all');

  interface Friend {
    id: number;
    name: string;
    avatar: string;
    status: 'blocked' | 'accepted' | 'pending';
  }

  const [friends, setFriends] = useState<Friend[]>([
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
  ]);

  const handleStatusChange = (friendId: number, newStatus: Friend['status']) => {
    setFriends(prevFriends => 
      Array.isArray(prevFriends) 
        ? prevFriends.map(friend => 
            friend.id === friendId ? { ...friend, status: newStatus } : friend
          )
        : []
    );
  };

  // Add safety check to ensure friends is always an array
  const safeFriends = Array.isArray(friends) ? friends : [];

  const filteredFriends = safeFriends.filter(friend => {
    if (sortBy === 'all') return true;
    return friend.status === sortBy;
  });

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'accepted': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );

  const XIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  const UserXIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );

  const UserPlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );

  const UsersIcon = ({ size = 32, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  const getActionButtons = (friend: Friend) => {
    switch (friend.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <button 
              onClick={() => handleStatusChange(friend.id, 'accepted')} 
              className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-green-600"
            >
              <CheckIcon /> Accept
            </button>
            <button 
              onClick={() => handleStatusChange(friend.id, 'blocked')} 
              className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-red-600"
            >
              <XIcon /> Decline
            </button>
          </div>
        );
      case 'accepted':
        return (
          <button 
            onClick={() => handleStatusChange(friend.id, 'blocked')} 
            className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-red-600"
          >
            <UserXIcon /> Unfriend
          </button>
        );
      case 'blocked':
        return (
          <button 
            onClick={() => handleStatusChange(friend.id, 'pending')} 
            className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-blue-600"
          >
            <UserPlusIcon /> Unblock
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="h-[700px] max-w-[1400px] bg-[#91BFBF] bg-opacity-85 mr-auto mt-12 rounded-xl p-6 pt-12 overflow-x-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#64B0C5 transparent',
      }}>
        <select
           value={sortBy}
           onChange={(e: Event) => setSortBy((e.target as HTMLSelectElement).value as Friend['status'] | 'all')}
           className="bg-white/20 fixed px-4 py-2 -mt-9 rounded-lg"
         >
           <option value="all">All</option>
           <option value="pending">Pending</option>
           <option value="accepted">Accepted</option>
           <option value="blocked">Blocked</option>
         </select>

      <div className="grid grid-cols-4 gap-4">
        {filteredFriends.map((friend, index) => (
          <div
            key={friend.id}
            className="w-[330px] h-[290px] bg-white/10 border border-white/20 rounded-lg p-4 relative"
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
              <div className="flex flex-col items-center gap-2">
                <span className={`text-sm text-white px-3 py-1 rounded-full ${getStatusColor(friend.status)}`}>
                  {friend.status}
                </span>
                <div className="mt-2">
                  {getActionButtons(friend)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};