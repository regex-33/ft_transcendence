import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';

type Friend = {
  id: number;
  username: string;
  avatar: string;
  online: boolean;
};

export const NotificationPanel: ComponentFunction = () => {
  const [pendingFriends, setPendingFriends] = useState<Friend[]>([]);
  const [showAll, setShowAll] = useState(false);

  const fetchPendingFriends = async () => {
    try {
      const response = await fetch(
        `http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/pending-friends`,
        { credentials: 'include' }
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch pending friends');
      }
  
      const data = await response.json();
  
      // Ensure it's an array and add 'pending' status to each friend
      const friendsArray: Friend[] = Array.isArray(data)
        ? data.map((f: any) => ({ ...f, status: 'pending' }))
        : [];
  
      setPendingFriends(friendsArray);
    } catch (err) {
      console.error('Error fetching pending friends:', err);
      setPendingFriends([]); // fallback
    }
  };
  

  useEffect(() => {
    fetchPendingFriends();
  }, []);

  const handleFriendAction = async (username: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, action: action === 'decline' ? 'cancel' : action })
      });

      if (!response.ok) throw new Error(`Failed to ${action} friend request`);

      await fetchPendingFriends();
    } catch (err) {
      console.error(`Error performing ${action} action:`, err);
    }
  };

  const renderActionButton = (friend: Friend) => {
      return (
        <div className="flex gap-2">
          <button 
            onClick={() => handleFriendAction(friend.username, 'accept')}
            className="flex items-center gap-2 px-4 h-[30px] bg-[url('/images/setting-assests/bg-accept.svg')] bg-no-repeat bg-center bg-contain text-white font-semibold text-sm transition-transform duration-200 hover:scale-95"
          >
            <i className="fa-solid fa-check text-sm"></i>
            <span>Accept</span>
          </button>
          <button 
            onClick={() => handleFriendAction(friend.username, 'decline')}
            className="flex items-center gap-2 px-4 h-[30px] bg-[url('/images/setting-assests/bg-decline.svg')] bg-no-repeat bg-center bg-contain text-white font-semibold text-sm transition-transform duration-200 hover:scale-95"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
            <span>Decline</span>
          </button>
        </div>
      );
  };
 console.log("type of pendingFriendssssssssss: ", typeof pendingFriends);
 console.log("arrrrrrrrrrrrrrrrrrrrrrrrrrrrr: ", Array.isArray(pendingFriends) );
 const displayUsers = showAll 
 ? (Array.isArray(pendingFriends) ? pendingFriends : []) 
 : (Array.isArray(pendingFriends) ? pendingFriends.slice(0,4) : []);

  return (
    <div className="absolute top-[58px] -right-40 mt-2 w-96 h-96 bg-[#5D9FA9] opacity-95 rounded-lg shadow-xl flex flex-col z-[9999]">
      <div className="p-4 border-b border-[#4E92A2] bg-[#5D9FA9] text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Your Notifications</h3>
          <button className="text-sm hover:underline">✓ Mark all as read</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-3 p-3">
          {displayUsers.map(user => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-3 pb-1 border-b border-[#91C7D6]"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  className="w-14 h-14 rounded-full object-cover border-4 border-white/20"
                  alt="Avatar"
                />
                <span className="font-irish text-white">{user.username}</span>
              </div>
              {renderActionButton(user)}
            </li>
          ))}
        </ul>
      </div>

      {pendingFriends.length > 4 && (
        <div className="p-3 border-t border-[#4E92A2] text-center">
          <button 
            onClick={() => setShowAll(prev => !prev)}
            className="text-sm text-teal-600 hover:underline"
          >
            {showAll ? 'See less' : 'See more notifications'}
          </button>
        </div>
      )}
    </div>
  );
};

export const NotificationButton: ComponentFunction = () => {
  const [showNotif, setShowNotif] = useState(false);

  const onNotifInput = (e?: Event) => {
    if (e) e.stopPropagation();
    setShowNotif(prev => !prev);
  };

  return (
    <div className="relative">
      <button 
        onClick={onNotifInput} 
        className="flex items-center gap-2 md:px-3 py-1 overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95"
      >
        <img src="/images/home-assests/notif-icon.svg" alt="notif" className="w-6 h-6 md:w-10 md:h-10" />
      </button>
      {showNotif && <NotificationPanel key="notif-panel" />}
    </div>
  );
};

