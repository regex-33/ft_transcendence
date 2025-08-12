import { h } from '../../vdom/createElement';
import { useState } from '../../hooks/useState';
import { ComponentFunction } from '../../types/global';
import { useEffect } from '../../hooks/useEffect';

// Define the Friend type
type Friend = {
  id: number;
  name: string;
  avatar: string;
  status: 'accepted' | 'pending' | 'blocked';
};

// Sample data
const friends: Friend[] = [
  { id: 1, name: 'Yous', avatar: "https://cdn.intra.42.fr/user/6a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'blocked' },
  { id: 2, name: 'Ssef', avatar: "https://cdn.intra.42.fr/user/6a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'accepted' },
  { id: 3, name: 'Alex', avatar: "https://cdn.intra.42.fr/user/6a865862fd567d74d06a2a7baf8/yachtata.jpeg", status: 'pending' },
  // ...other friends...
];

export const FriendsSettings: ComponentFunction = () => {
  // State for filter: all, accepted, pending, blocked
  const [sortBy, setSortBy] = useState<'all' | 'accepted' | 'pending' | 'blocked'>('all');

  // Compute filtered list based on sortBy
  const filteredFriends = friends.filter(
    (f) => sortBy === 'all' || f.status === sortBy
  );

  return (
    <div className="p-4">
      {/* Sort by dropdown */}
      <div className="mb-4">
        <label htmlFor="sortBy" className="mr-2">Sort by:</label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border rounded px-2 py-1"
        >
          <option value="all">All</option>
          <option value="accepted">Accepted</option>
          <option value="pending">Pending</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Friend list grid (filtered) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFriends.map((friend) => (
          <div key={friend.id} className="border rounded-lg p-4 flex items-center space-x-4">
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium">{friend.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{friend.status}</p>
            </div>
            <div>
              <button className="px-2 py-1 bg-green-400 rounded text-white">
                Action
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
