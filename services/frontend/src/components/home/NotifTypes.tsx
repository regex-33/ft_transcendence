// notifTypes.ts
export interface Notification {
    id: string;
    type: 'friend_request' | 'message' | 'game' | 'system';
    user: {
      id: string;
      username: string;
      avatar: string;
    };
    timestamp: string;
    message: string;
    isRead: boolean;
    actions?: NotificationAction[];
  }
  
  export interface NotificationAction {
    type: 'accept' | 'refuse' | 'view' | 'match';
    label: string;
    variant: 'primary' | 'secondary' | 'danger';
  }
  
  export interface NotificationItemProps {
    key?: string | number;  
    notification: Notification;
    onAction: (notificationId: string, actionType: string) => void;
  }
  
  export interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
  }