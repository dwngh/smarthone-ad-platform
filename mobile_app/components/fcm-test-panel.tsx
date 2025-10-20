import fcmService from '@/services/fcmService';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const FCMTestPanel: React.FC = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Get FCM token for testing
    fcmService.getFCMToken().then((token) => {
      setFcmToken(token);
    });
    
    setIsInitialized(true);
  }, []);

  const handleTestForegroundNotification = () => {
    Alert.alert(
      'Test Notification',
      'This simulates a foreground notification. In a real app, this would come from FCM.',
      [{ text: 'OK' }]
    );
  };

  const handleSubscribeToTopic = async () => {
    try {
      await fcmService.subscribeToTopic('test_topic');
      Alert.alert('Success', 'Subscribed to test_topic');
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to topic');
    }
  };

  const handleUnsubscribeFromTopic = async () => {
    try {
      await fcmService.unsubscribeFromTopic('test_topic');
      Alert.alert('Success', 'Unsubscribed from test_topic');
    } catch (error) {
      Alert.alert('Error', 'Failed to unsubscribe from topic');
    }
  };

  const copyTokenToClipboard = () => {
    if (fcmToken) {
      console.log('FCM Token:', fcmToken);
      Alert.alert(
        'FCM Token',
        `Token: ${fcmToken}\n\nUse this token to send test notifications from Firebase Console or your server.`,
        [
          { text: 'OK' }
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>FCM Test Panel</Text>
      
      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>
          FCM Initialized: {isInitialized ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={styles.statusText}>
          Token Available: {fcmToken ? '✅ Yes' : '❌ No'}
        </Text>
      </View>

      {/* FCM Token */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Token</Text>
        <TouchableOpacity style={styles.button} onPress={copyTokenToClipboard}>
          <Text style={styles.buttonText}>Show FCM Token</Text>
        </TouchableOpacity>
        {fcmToken && (
          <Text style={styles.tokenText} numberOfLines={3}>
            {fcmToken.substring(0, 50)}...
          </Text>
        )}
      </View>

      {/* Test Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Actions</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleTestForegroundNotification}>
          <Text style={styles.buttonText}>Test Foreground Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSubscribeToTopic}>
          <Text style={styles.buttonText}>Subscribe to Test Topic</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleUnsubscribeFromTopic}>
          <Text style={styles.buttonText}>Unsubscribe from Test Topic</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Testing Instructions</Text>
        <Text style={styles.instructionText}>
          1. Copy the FCM token above{'\n'}
          2. Go to Firebase Console {'>'} Cloud Messaging{'\n'}
          3. Create a new message and paste the token{'\n'}
          4. Send the message to test different app states:{'\n'}
          {'   '}• Foreground: App is open and active{'\n'}
          {'   '}• Background: App is in background{'\n'}
          {'   '}• Killed: Close app completely then send message
        </Text>
      </View>

      {/* Message Format Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message Format Examples</Text>
        <Text style={styles.codeText}>
          {`// Sensor Update Message Data:\n`}
          {`{\n`}
          {`  "type": "sensor_update",\n`}
          {`  "deviceId": "temp_sensor_01",\n`}
          {`  "sensorType": "temperature",\n`}
          {`  "value": "23.5"\n`}
          {`}`}
        </Text>
        
        <Text style={styles.codeText}>
          {`// Device Alert Message Data:\n`}
          {`{\n`}
          {`  "type": "device_alert",\n`}
          {`  "deviceId": "security_cam_01",\n`}
          {`  "alertType": "motion_detected",\n`}
          {`  "severity": "medium"\n`}
          {`}`}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  codeText: {
    fontSize: 12,
    color: '#333',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
});