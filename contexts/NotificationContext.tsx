import React, { createContext, useContext, useState, useCallback } from 'react';
import RealtimeNotifications, { Notification } from '../components/RealtimeNotifications';
import WebApp from '@twa-dev/sdk';

interface NotificationContextType {
  showNotification: (type: Notification['type'], title: string, message: string, duration?: number) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((
    type: Notification['type'], 
    title: string, 
    message: string, 
    duration = 4000
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Вибрация для важных уведомлений
    try {
      if (type === 'success') {
        WebApp.HapticFeedback.notificationOccurred('success');
      } else if (type === 'error') {
        WebApp.HapticFeedback.notificationOccurred('error');
      } else if (type === 'warning') {
        WebApp.HapticFeedback.notificationOccurred('warning');
      }
    } catch (e) {
      // Игнорируем ошибки WebApp API
    }
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showNotification('success', title, message);
  }, [showNotification]);

  const showError = useCallback((title: string, message: string) => {
    showNotification('error', title, message, 6000); // Ошибки показываем дольше
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    showNotification('info', title, message);
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string) => {
    showNotification('warning', title, message, 5000);
  }, [showNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <RealtimeNotifications 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};