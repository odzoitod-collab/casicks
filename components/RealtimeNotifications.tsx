import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Показываем уведомление
    setTimeout(() => setIsVisible(true), 100);

    // Автоматически скрываем
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300);
    }, notification.duration || 4000);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle size={20} className="text-green-400" />;
      case 'error': return <AlertCircle size={20} className="text-red-400" />;
      case 'warning': return <AlertCircle size={20} className="text-yellow-400" />;
      default: return <Info size={20} className="text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-600/90';
      case 'error': return 'bg-red-600/90';
      case 'warning': return 'bg-yellow-600/90';
      default: return 'bg-blue-600/90';
    }
  };

  return (
    <div 
      className={`
        ${getBgColor()} backdrop-blur-md text-white p-4 rounded-xl shadow-lg border border-white/10 mb-2 min-w-[300px] max-w-[400px]
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{notification.title}</div>
          <div className="text-xs opacity-90 mt-1">{notification.message}</div>
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(notification.id), 300);
          }}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

interface RealtimeNotificationsProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[300] space-y-2">
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onClose={onRemove} 
        />
      ))}
    </div>
  );
};

export default RealtimeNotifications;