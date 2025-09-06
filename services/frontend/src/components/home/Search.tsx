import { useState } from "../../hooks/useState";
import { useRef } from "../../hooks/useRef";
import { useEffect } from "../../hooks/useEffect";
import { ComponentFunction } from "../../types/global";
import { h } from "../../vdom/createElement";

type User = {
  id: number;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  online: boolean;
  location: string | null;
  birthday: string | null;
};

type FriendStatus = 'none' | 'pending' | 'accepted' | 'blocked';

type UserWithFriendStatus = User & {
  friendStatus: FriendStatus;
};

export const Search: ComponentFunction = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [users, setUsers] = useState<UserWithFriendStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users and friends data
      const [usersResponse, friendsResponse, pendingResponse, blockedResponse] = await Promise.all([
        fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/users`),
        fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/friends`),
        fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/pending-friends`),
        fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/blocked-users`)
      ]);

      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }

      const [allUsers, acceptedFriends, pendingFriends, blockedUsers] = await Promise.all([
        usersResponse.json(),
        friendsResponse.ok ? friendsResponse.json() : [],
        pendingResponse.ok ? pendingResponse.json() : [],
        blockedResponse.ok ? blockedResponse.json() : []
      ]);

      // Create maps for friend statuses
      const acceptedMap = new Map(acceptedFriends.map((f: any) => [f.username, 'accepted']));
      const pendingMap = new Map(pendingFriends.map((f: any) => [f.username, 'pending']));
      const blockedMap = new Map(blockedUsers.map((f: any) => [f.username, 'blocked']));

      // Add friend status to users
      const usersWithStatus: UserWithFriendStatus[] = allUsers.map((user: User) => ({
        ...user,
        friendStatus: (
          acceptedMap.get(user.username) ||
          pendingMap.get(user.username) ||
          blockedMap.get(user.username) ||
          'none'
        ) as FriendStatus
      }));

      setUsers(usersWithStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle friend actions
  const handleFriendAction = async (username: string, action: 'add' | 'cancel') => {
    try {
      let response;
      
      if (action === 'add') {
        // Add friend
        response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username })
        });
      } else {
        // Cancel friend request
        response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, action: 'cancel' })
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${action} friend`);
      }

      // Refresh users data to update friend statuses
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(`Error performing ${action} action:`, err);
    }
  };

  // Fetch users when component mounts or when search opens
  useEffect(() => {
    if (showSearch && users.length === 0) {
      fetchUsers();
    }
  }, [showSearch]);

  console.log('type:', typeof searchQuery, searchQuery);
  const trimmed = (typeof searchQuery === 'string' ? searchQuery : '').trim().toLowerCase();
  const isSearching = trimmed.length > 0;

  const defaultUsers = users
    .filter(u => u.online)
    .concat(users.filter(u => !u.online))
    .slice(0, 5);
  
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(trimmed)
  );
  
  let displayUsers: UserWithFriendStatus[] = [];
  let showNoResults = false;
  
  if (!isSearching) {
    displayUsers = defaultUsers;
  } else if (filteredUsers.length > 0) {
    displayUsers = filteredUsers;
  } else {
    showNoResults = true;
  }
  
  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
  };
  
  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseSearch();
    }
  };

  useEffect(() => {
    if (!showSearch) return;
    
    const handleClickOutside = (e: Event) => {
      const target = e.target as Element;
      if (modalRef.current && !modalRef.current.contains(target)) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
  
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 200);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showSearch]);

  const onSearchInput = () => {
    setShowSearch(true);
  };

 
  const renderActionButton = (user: UserWithFriendStatus) => {
    if (user.friendStatus === 'none') {
      return (
        <button
          onClick={() => handleFriendAction(user.username, 'add')}
          className="
            flex items-center gap-2 px-3 h-[30px]
            bg-[url('/images/home-assests/bg-FriendsAdd.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-sm
            transition-transform duration-200 hover:scale-95 pl-1
          ">
          <img
            src="/images/setting-assests/plus-friends.svg"
            alt="Add"
            className="w-7 h-7"
          />
          <span>Add Friend</span>
        </button>
      );
    } else if (user.friendStatus === 'pending') {
      return (
        <button
          onClick={() => handleFriendAction(user.username, 'cancel')}
          className="
            flex items-center gap-2 px-6 pl-4 h-[60px]
            bg-[url('/images/home-assests/bg-cancel.svg')]
            bg-no-repeat bg-center bg-contain
            text-white font-semibold text-sm
            transition-transform duration-200 hover:scale-95 p-5
          ">
          <i className="fa-solid fa-xmark text-lg"></i>
          <span className="text-md">Cancel</span>
        </button>
      );
    } else if (user.friendStatus === 'accepted') {
      return (
        <span className="text-green-400 font-semibold text-sm">
          ✓ Friends
        </span>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="min-w-0">
        <button
          onClick={onSearchInput}
          className="flex items-center gap-2 md:px-3 py-1 overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95"
        >
          <img src="/images/home-assests/search-icon.svg" alt="search" className="w-6 h-6 md:w-10 md:h-10" />
        </button>
      </div>
      {showSearch && (
        <div 
          className="fixed inset-0 bg-[#193D47] bg-opacity-70 flex justify-center items-center z-50"
          onClick={handleOverlayClick}
        >
          <div
            ref={modalRef}
            className="bg-[#64B0C5] w-[500px] p-2 h-[450px] rounded-3xl shadow-lg relative focus:outline-none"
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <div className="relative w-full">
              <span className="absolute top-[42px] left-1 flex items-center pl-3">
                <i className="fa-solid fa-magnifying-glass text-md text-[#D3DDE3]"></i>
              </span>
              <input
                type="text"
                placeholder="Search for a user"
                className="w-full px-10 pb-3 mb-1 pt-10 placeholder-[#D3DDE3] border-b-[1px] border-[#FFFFFF] bg-transparent text-white focus:outline-none"
                value={searchQuery}
                onInput={(e: InputEvent) =>
                  setSearchQuery((e.target as HTMLInputElement).value)
                }
                spellCheck={false}
                autoFocus
              />
            </div>

            {error && (
              <div className="text-red-300 text-center mt-4 mb-2">
                Error: {error}
              </div>
            )}

            {loading ? (
              <div className="text-white text-center mt-40">
                Loading users...
              </div>
            ) : showNoResults ? (
              <div className="text-3xl font-irish text-gray-100 mt-40 ml-24">
                No users found!
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-300">
                <ul className="space-y-3">
                  {displayUsers.map(user => (
                    <li
                      key={user.id}
                      className="flex ml-5 w-[420px] items-center justify-between gap-3 pb-1 border-b border-[#91C7D6]"
                    >
                      {/* Left side: avatar + name */}
                      <div className="flex items-center gap-3">
                        <div
                          className="relative w-14 h-14 flex items-center justify-center bg-no-repeat bg-contain"
                          style={{
                            backgroundImage: user.online
                              ? 'url("/images/home-assests/cir-online.svg")'
                              : 'url("/images/home-assests/cir-offline.svg")'
                          }}
                        >
                          <img
                            src={user.avatar}
                            alt="User Avatar"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <span className="font-irish text-white">{user.username}</span>
                      </div>
                      
                      {/* Right side: action button */}
                      {renderActionButton(user)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};



