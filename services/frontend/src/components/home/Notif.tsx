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
import { useRef } from '../../hooks/useRef';

export const NotificationItem: ComponentFunction<NotificationItemProps> = ({ 
  notification, 
  onAction 
}) => {
  const handleAction = (actionType: string) => {
    onAction(notification.id, actionType);
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 hour ago';
    return `${diff} hours ago`;
  };

  const getActionButtonClass = (variant: string): string => {
    const baseClass = "px-4 py-1 rounded text-sm font-medium transition-colors duration-200";
    switch (variant) {
      case 'primary':
        return `${baseClass} bg-green-500 hover:bg-green-600 text-white`;
      case 'secondary':
        return `${baseClass} bg-gray-300 hover:bg-gray-400 text-gray-700`;
      case 'danger':
        return `${baseClass} bg-red-500 hover:bg-red-600 text-white`;
      default:
        return `${baseClass} bg-blue-500 hover:bg-blue-600 text-white`;
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 ${!notification.isRead ? 'bg-blue-50' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <img
          src={notification.user.avatar}
          alt={notification.user.username}
          className="w-10 h-10 rounded-full"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900 text-sm">
            {notification.user.username}
          </span>
          <span className="text-xs text-gray-500">
            {getTimeAgo(notification.timestamp)}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">
          {notification.message}
        </p>

        {/* Action Buttons */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex gap-2">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action.type)}
                className={getActionButtonClass(action.variant)}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export const NotificationPanel: ComponentFunction = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');  
  
  // Mock data - replace with actual API call
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'friend_request',
        user: {
          id: '1',
          username: 'duva@duva.234e50',
          avatar: '/images/avatars/user1.png'
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        message: 'is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text since the 1500s',
        isRead: false,
        actions: []
      },
      {
        id: '2',
        type: 'friend_request',
        user: {
          id: '2',
          username: '@abdo_847848',
          avatar: '/images/avatars/user2.png'
        },
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        message: 'sent you a friend request',
        isRead: false,
        actions: [
          { type: 'refuse', label: 'refuse', variant: 'secondary' },
          { type: 'accept', label: 'Add', variant: 'primary' }
        ]
      },
      {
        id: '3',
        type: 'message',
        user: {
          id: '3',
          username: '@wahlba_tv_373',
          avatar: '/images/avatars/user3.png'
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        message: 'is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the...',
        isRead: false,
        actions: []
      },
      {
        id: '4',
        type: 'game',
        user: {
          id: '1',
          username: 'duva@duva.234e50',
          avatar: '/images/avatars/user1.png'
        },
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        message: 'wants to play a game with you',
        isRead: true,
        actions: [
          { type: 'match', label: 'Matche 🔥', variant: 'primary' },
          { type: 'refuse', label: 'refuse', variant: 'secondary' }
        ]
      }
    ];
  }, []);

  return (
    <div className="absolute top-full right-0 mt-2 w-96 h-96 bg-[#5D9FA9] opacity-95 rounded-lg shadow-xl max-h-96 flex flex-col z-[9999]">
      {/* Header */}
      <div className="p-4 border-b border-[#4E92A2] bg-[#5D9FA9] text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Your notifications</h3>
          <button
            // onClick={handleMarkAllAsRead}
            className="text-sm hover:underline"
          >
            ✓ Mark all as read
          </button>
        </div>
        
        {/* Filter Tabs */}
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
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {/* Add your notification items here */}
        <div className="p-4 text-center text-gray-500">
          No notifications
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 text-center">
        <button className="text-sm text-teal-600 hover:underline">
          See more notifications
        </button>
      </div>
    </div>
  );
};

export const NotificationButton: ComponentFunction = () => {
  const [showNotif, setShowNotif] = useState(false);
  
  const onNotifInput = () => {
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

