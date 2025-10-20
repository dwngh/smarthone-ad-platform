import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

// Use the Firebase messaging types
type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

class FCMService {
  private unsubscribeTokenRefresh?: () => void;
  private unsubscribeForeground?: () => void;
  private unsubscribeBackground?: () => void;

  /**
   * Initialize FCM service - call this at app startup
   */
  async initialize(): Promise<void> {
    try {
      // Request permission for iOS and Android 13+
      await this.requestPermission();

      // Get FCM token
      const token = await this.getFCMToken();
      console.log('FCM Token:', token);

      // Set up message handlers
      this.setupMessageHandlers();

      console.log('FCM Service initialized successfully');
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Get FCM registration token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Setup all message handlers for different app states
   */
  setupMessageHandlers(): void {
    // Handle foreground messages
    this.unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('FCM message received in foreground:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    // Handle background/quit state messages when app is opened from notification
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Check whether an initial notification is available (app opened from quit state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });

    // Handle background messages (when app is in background but not killed)
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
      this.handleBackgroundMessage(remoteMessage);
    });

    // Handle token refresh
    this.unsubscribeTokenRefresh = messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      // Send new token to your server
      this.onTokenRefresh(token);
    });
  }

  /**
   * Handle messages when app is in foreground
   */
  handleForegroundMessage(remoteMessage: RemoteMessage): void {
    const { notification, data } = remoteMessage;
    
    if (notification) {
      // Show in-app alert for foreground messages
      Alert.alert(
        notification.title || 'Notification',
        notification.body || 'You have a new message',
        [
          {
            text: 'Dismiss',
            style: 'cancel',
          },
          {
            text: 'View',
            onPress: () => this.handleNotificationPress(remoteMessage),
          },
        ]
      );
    }

    // Handle custom data
    if (data) {
      this.handleCustomData(data as { [key: string]: string });
    }
  }

  /**
   * Handle messages when app is in background (but not killed)
   */
  handleBackgroundMessage(remoteMessage: RemoteMessage): void {
    console.log('Background message processed:', remoteMessage);
    
    // You can perform background tasks here
    // Note: Background handler has time limits (~30 seconds on iOS, varies on Android)
    
    const { data } = remoteMessage;
    if (data) {
      // Process data silently in background
      this.processBackgroundData(data as { [key: string]: string });
    }
  }

  /**
   * Handle notification press (when user taps notification)
   */
  handleNotificationPress(remoteMessage: RemoteMessage): void {
    console.log('User pressed notification:', remoteMessage);
    
    const { data, notification } = remoteMessage;
    
    // Navigate to specific screen based on notification data
    if (data?.screen && typeof data.screen === 'string') {
      this.navigateToScreen(data.screen, data as { [key: string]: string });
    } else if (data?.deviceId && typeof data.deviceId === 'string') {
      // Navigate to device details
      this.navigateToDevice(data.deviceId);
    } else {
      // Default action - navigate to home
      this.navigateToHome();
    }
  }

  /**
   * Handle custom data from FCM message
   */
  handleCustomData(data: { [key: string]: string }): void {
    console.log('Processing custom data:', data);
    
    // Handle different data types
    if (data.type === 'sensor_update') {
      this.handleSensorUpdate(data);
    } else if (data.type === 'device_status') {
      this.handleDeviceStatus(data);
    } else if (data.type === 'alert') {
      this.handleAlert(data);
    }
  }

  /**
   * Process data in background (when app is backgrounded but not killed)
   */
  processBackgroundData(data: { [key: string]: string }): void {
    // Handle background data processing
    if (data.type === 'sensor_update') {
      // Update local storage or cache with sensor data
      console.log('Background sensor update:', data);
    }
  }

  /**
   * Handle sensor update notifications
   */
  handleSensorUpdate(data: { [key: string]: string }): void {
    const { deviceId, sensorType, value } = data;
    console.log(`Sensor update - Device: ${deviceId}, Type: ${sensorType}, Value: ${value}`);
    
    // Update local state or trigger UI refresh
    // You can emit events here or update global state
  }

  /**
   * Handle device status notifications
   */
  handleDeviceStatus(data: { [key: string]: string }): void {
    const { deviceId, status } = data;
    console.log(`Device status - Device: ${deviceId}, Status: ${status}`);
    
    // Update device status in local state
  }

  /**
   * Handle alert notifications
   */
  handleAlert(data: { [key: string]: string }): void {
    const { alertType, message, severity } = data;
    console.log(`Alert - Type: ${alertType}, Message: ${message}, Severity: ${severity}`);
    
    // Handle different alert types (security, system, maintenance, etc.)
  }

  /**
   * Navigate to specific screen
   */
  navigateToScreen(screenName: string, data?: { [key: string]: string }): void {
    console.log(`Navigate to screen: ${screenName}`, data);
    // Implement navigation logic here
    // You'll need to integrate with your navigation system (Expo Router)
  }

  /**
   * Navigate to device details
   */
  navigateToDevice(deviceId: string): void {
    console.log(`Navigate to device: ${deviceId}`);
    // Implement device navigation
  }

  /**
   * Navigate to home screen
   */
  navigateToHome(): void {
    console.log('Navigate to home');
    // Implement home navigation
  }

  /**
   * Handle token refresh
   */
  onTokenRefresh(newToken: string): void {
    console.log('New FCM token received:', newToken);
    // Send the new token to your server
    // This is important for maintaining push notification delivery
  }

  /**
   * Subscribe to a topic for receiving targeted notifications
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  /**
   * Send a local notification (for testing)
   */
  sendLocalNotification(title: string, body: string, data?: any): void {
    // This would typically use @react-native-firebase/messaging for local notifications
    // or integrate with Expo Notifications
    console.log('Local notification:', { title, body, data });
  }

  /**
   * Clean up listeners when app is destroyed
   */
  cleanup(): void {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
    }
    if (this.unsubscribeBackground) {
      this.unsubscribeBackground();
    }
    if (this.unsubscribeTokenRefresh) {
      this.unsubscribeTokenRefresh();
    }
  }
}

// Export singleton instance
export default new FCMService();