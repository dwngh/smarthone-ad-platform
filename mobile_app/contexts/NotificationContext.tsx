import fcmService from '@/services/fcmService';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface AlertNotification {
  id: string;
  alertName: string;
  deviceId: string;
  reason: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  type?: string;
}

interface NotificationContextType {
  notifications: AlertNotification[];
  addNotification: (notification: AlertNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  useEffect(() => {
    // Initialize FCM service
    fcmService.initialize();

    // Listen for foreground messages
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('FCM message received (foreground):', remoteMessage);
      
      const newAlert = createAlertFromFCM(remoteMessage);
      if (newAlert) {
        addNotification(newAlert);
      }
    });

    // Listen for notification opened app (from background)
    const unsubscribeNotificationOpen = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('FCM notification opened app:', remoteMessage);
      
      if (remoteMessage) {
        const openedAlert = createAlertFromFCM(remoteMessage);
        if (openedAlert) {
          addNotification(openedAlert);
        }
      }
    });

    // Check for initial notification (if app was opened from notification)
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('FCM initial notification:', remoteMessage);
        const initialAlert = createAlertFromFCM(remoteMessage);
        if (initialAlert) {
          addNotification(initialAlert);
        }
      }
    });

    // Subscribe to relevant topics
    // fcmService.subscribeToTopic('home_alerts');
    // fcmService.subscribeToTopic('device_notifications');
    // fcmService.subscribeToTopic('security_alerts');

    return () => {
      unsubscribeForeground();
      unsubscribeNotificationOpen();
    };
  }, []);

  const createAlertFromFCM = (remoteMessage: FirebaseMessagingTypes.RemoteMessage): AlertNotification | null => {
    const { data, notification, messageId } = remoteMessage;
    
    if (!data && !notification) return null;

    // Safely extract string values from FCM data
    const getStringValue = (value: string | object | undefined, fallback: string): string => {
      return typeof value === 'string' ? value : fallback;
    };

    return {
      id: messageId || Date.now().toString(),
      alertName: getStringValue(data?.alertName, notification?.title || 'Smart Home Alert'),
      deviceId: getStringValue(data?.deviceId, 'unknown_device'),
      reason: getStringValue(data?.reason, notification?.body || 'No details provided'),
      timestamp: new Date(),
      severity: (typeof data?.severity === 'string' ? data.severity as 'low' | 'medium' | 'high' | 'critical' : 'medium'),
      isRead: false,
      type: getStringValue(data?.type, 'general'),
    };
  };

  const addNotification = (notification: AlertNotification) => {
    setNotifications(prev => {
      // Avoid duplicates based on ID
      if (prev.find(n => n.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev];
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};