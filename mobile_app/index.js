/**
 * Background message handler for React Native Firebase
 * This file is used to handle FCM messages when the app is in the background or killed
 */

import messaging from '@react-native-firebase/messaging';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  
  const { data, notification } = remoteMessage;
  
  // Handle different message types in background
  if (data) {
    switch (data.type) {
      case 'sensor_update':
        console.log('Background sensor update:', data);
        // You can update local storage, schedule local notifications, etc.
        break;
      
      case 'device_alert':
        console.log('Background device alert:', data);
        // Handle urgent device alerts
        break;
      
      case 'system_notification':
        console.log('Background system notification:', data);
        // Handle system-wide notifications
        break;
      
      default:
        console.log('Unknown background message type:', data);
    }
  }
  
  // You can also handle the notification part
  if (notification) {
    console.log('Background notification:', notification.title, notification.body);
  }
});