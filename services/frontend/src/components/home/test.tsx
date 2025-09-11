import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';
import { 
  Notification, 
  NotificationAction, 
  NotificationItemProps, 
  NotificationPanelProps 
} from './NotifTypes';

interface Friend {
  id: number;
  username: string;
  avatar: string;
  online: boolean;
  status: string;
}

// export const NotificationItem: ComponentFunction<NotificationItemProps> = ({ 
//   notification, 
//   onAction 
// }) => {
//   const handleAction = (actionType: string) => {
//     onAction(notification.id, actionType);
//   };

//   const getTimeAgo = (timestamp: string): string => {
//     const now = new Date();
//     const time = new Date(timestamp);
//     const diff = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
//     if (diff < 1) return 'Just now';
//     if (diff === 1) return '1 hour ago';
//     return `${diff} hours ago`;
//   };

//   return (
//     <div className={`flex items-start gap-3 p-4 border-b border-[#4E92A2] border-[1px]
//      hover:bg-gray-50 transition-colors duration-200 ${!notification.isRead ? 'bg-[#5D9FA9]' : ''}`}>
      
//       <div className="flex-shrink-0">
//         <img
//           src={notification.user.avatar}
//           alt={notification.user.username}
//           className="w-10 h-10 rounded-full"
//         />
//       </div>


//       <div className="flex-1 min-w-0">
//         <div className="flex items-center justify-between mb-1">
//           <span className="font-medium text-gray-900 text-sm">
//             {notification.user.username}
//           </span>
//           <span className="text-xs text-gray-500">
//             {getTimeAgo(notification.timestamp)}
//           </span>
//         </div>
        
//         <p className="text-sm text-gray-600 mb-3">
//           {notification.message}
//         </p>

//         {notification.type === 'friend_request' && (
//           <div className="flex gap-2">
//             <button 
//               onClick={() => handleAction('accept')}
//               className="
//               flex items-center gap-2 px-4 h-[30px]
//               bg-[url('/images/setting-assests/bg-accept.svg')]
//               bg-no-repeat bg-center bg-contain
//               text-white font-semibold text-sm
//               transition-transform duration-200 hover:scale-95 
//             ">
//               <i className="fa-solid fa-check text-sm"></i>
//               <span>Accept</span>
//             </button>
//             <button 
//               onClick={() => handleAction('decline')}
//               className="
//               flex items-center gap-2 px-4 h-[30px]
//               bg-[url('/images/setting-assests/bg-decline.svg')]
//               bg-no-repeat bg-center bg-contain
//               text-white font-semibold text-sm
//               transition-transform duration-200 hover:scale-95 
//             ">
//               <i className="fa-solid fa-xmark text-sm"></i>
//               <span>Decline</span>
//             </button>
//           </div>
//         )}
//       </div>

     
//       {!notification.isRead && (
//         <div className="flex-shrink-0">
//           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//         </div>
//       )}
//     </div>
//   );
// };

export const NotificationPanel: ComponentFunction = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  // const [notifications, setNotifications] = useState<Notification[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  const fetchPendingFriends = async () => {
    try {
      // setLoading(true);
      // setError(null);
      
      const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/pending-friends`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending friends');
      }

      const pendingFriends = await response.json();
      
      // Convert pending friends to notifications format
      const friendNotifications: Notification[] = pendingFriends
        .filter((friend: Friend) => friend.status === 'pending')
        .map((friend: Friend) => ({
          id: `friend_${friend.id}`,
          type: 'friend_request' as const,
          user: {
            id: friend.id.toString(),
            username: friend.username,
            avatar: friend.avatar
          },
          timestamp: new Date().toISOString(), // You might want to get actual timestamp from API
          message: 'sent you a friend request',
          isRead: false
        }));

      // setNotifications(friendNotifications);
    } catch (err) {
      // setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching pending friends:', err);
    } 
  };

  useEffect(() => {
    fetchPendingFriends();
  }, []);

  const handleFriendAction = async (username: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/friends/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          username, 
          action: action === 'decline' ? 'cancel' : action 
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} friend request`);
      }

      await fetchPendingFriends();
    } catch (err) {
      // setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(`Error performing ${action} action:`, err);
    }
  };

  // const handleAction = (notificationId: string, actionType: string) => {
  //   console.log(`Action ${actionType} for notification ${notificationId}`);
    
  //   // Find the notification to get the username
  //   const notification = notifications.find(n => n.id === notificationId);
  //   if (!notification) return;

  //   const username = notification.user.username;

  //   if (actionType === 'accept' || actionType === 'decline') {
  //     handleFriendAction(username, actionType as 'accept' | 'decline');
  //   }

  //   // Mark as read
  //   setNotifications((prev) => {
  //     if (!Array.isArray(prev)) {
  //       console.warn('notifications is not an array:', prev);
  //       return [];
  //     }
  //     return prev.map(notif => 
  //       notif.id === notificationId 
  //         ? { ...notif, isRead: true }
  //         : notif
  //     );
  //   });
  // };

  // const handleMarkAllAsRead = () => {
  //   setNotifications((prev) => {
  //     if (!Array.isArray(prev)) {
  //       console.warn('notifications is not an array:', prev);
  //       return [];
  //     }
  //     return prev.map(notif => ({ ...notif, isRead: true }));
  //   });
  // };

  // // Ensure notifications is always an array
  // const notificationsArray = Array.isArray(notifications) ? notifications : [];
  // const filteredNotifications = filter === 'all'
  //   ? notificationsArray
  //   : notificationsArray.filter(notif => !notif.isRead);
  // const unreadCount = notificationsArray.filter(notif => !notif.isRead).length;

  // if (loading) {
  //   return (
  //     <div className="absolute top-[58px] -right-40 mt-2 w-96 h-96 bg-[#5D9FA9] opacity-95 rounded-lg shadow-xl max-h-96 flex flex-col z-[9999]">
  //       <div className="p-4 text-center text-white">
  //         Loading notifications...
  //       </div>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="absolute top-[58px] -right-40 mt-2 w-96 h-96 bg-[#5D9FA9] opacity-95 rounded-lg shadow-xl max-h-96 flex flex-col z-[9999]">
  //       <div className="p-4 text-center text-red-300">
  //         Error: {error}
  //         <button 
  //           onClick={fetchPendingFriends}
  //           className="block mt-2 text-white hover:underline"
  //         >
  //           Try again
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="absolute top-[58px] -right-40 mt-2 w-96 h-96 bg-[#5D9FA9] opacity-95 rounded-lg shadow-xl max-h-96 flex flex-col z-[9999]">
      <div className="p-4 border-b border-[#4E92A2] border-[1px] bg-[#5D9FA9] text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Friend Requests</h3>
          <button
            // onClick={handleMarkAllAsRead}
            className="text-sm hover:underline"
          >
            ✓ Mark all as read
          </button>
        </div>
        
        <div className="flex mt-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded ${
              filter === 'all' 
                ? 'bg-white text-teal-500' 
                : 'bg-teal-400 text-white hover:bg-teal-300'
            }`}
          >
            All 
            {/* {notificationsArray.length > 0 && `${notificationsArray.length}`} */}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`ml-2 px-3 py-1 text-xs rounded ${
              filter === 'unread' 
                ? 'bg-white text-teal-500' 
                : 'bg-teal-400 text-white hover:bg-teal-300'
            }`}
          >
            Unread 
            {/* {unreadCount > 0 && `${unreadCount}`} */}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* {filteredNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {filter === 'unread' ? 'No unread notifications' : 'No friend requests'}
          </div>
        ) : (
          filteredNotifications.map((notification: Notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onAction={handleAction}
            />
          ))
        )} */}
      </div>
      
      <div className="p-3 border-t border-[#4E92A2] border-[1px] text-center">
        <button 
          onClick={fetchPendingFriends}
          className="text-sm text-teal-600 hover:underline"
        >
         see more notifications
        </button>
      </div>
    </div>
  );
};

export const NotificationButton: ComponentFunction = () => {
  const [showNotif, setShowNotif] = useState(false);
  
  const onNotifInput = (e?: Event) => {
    if (e) {
      e.stopPropagation();
    }
    setShowNotif(prev => !prev);
  };

  return (
    <div className="relative">
      <button 
        onClick={onNotifInput} 
        className="flex items-center gap-2 md:px-3 py-1 overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95"
      >
        <img 
          src="/images/home-assests/notif-icon.svg" 
          alt="notif" 
          className="w-6 h-6 md:w-10 md:h-10" 
        />
      </button>

      {showNotif && <NotificationPanel />}
    </div>
  );
};