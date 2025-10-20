import { BottomNavigation } from '@/components/bottom-navigation';
import { SmartHomeBackground } from '@/components/smart-home-background';
import { TopNavigation } from '@/components/top-navigation';
import { useNotifications } from '@/contexts/NotificationContext';
import fcmService from '@/services/fcmService';
import { Ionicons } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AlertScreen() {
  const {
    notifications,
    markAsRead,
    clearAllNotifications,
    addNotification,
    unreadCount
  } = useNotifications();
  const [activeTab, setActiveTab] = useState(1); // Alert tab is index 1
  
  const showFCMToken = async () => {
    try {
      const token = await fcmService.getFCMToken();
      if (token) {
        Alert.alert(
          'FCM Token for Testing',
          `Use this token in Firebase Console to send test notifications:\n\n${token}`,
          [
            { text: 'Close', style: 'cancel' },
            {
              text: 'Copy Token', 
              onPress: () => {
                Clipboard.setString(token);
                console.log('FCM Token copied to clipboard:', token);
                // Show a brief confirmation
                Alert.alert('Copied!', 'FCM token copied to clipboard');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Could not retrieve FCM token');
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      Alert.alert('Error', 'Failed to get FCM token');
    }
  };

  useEffect(() => {
    // FCM notifications are automatically captured by NotificationContext
    // No need to add sample data - real FCM messages will appear here
    console.log('Alert screen loaded. Current notifications:', notifications.length);
  }, [notifications.length]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFBB33';
      case 'low': return '#00C851';
      default: return '#6c757d';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'alert-circle';
      case 'high': return 'warning';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'notifications';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <SmartHomeBackground>
      <View style={styles.container}>
        <TopNavigation
          title="Alerts & Notifications"
          onBackPress={() => console.log('Back pressed')}
          onPlusPress={() => console.log('Add alert pressed')}
          onMenuPress={() => console.log('Menu pressed')}
        />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>FCM Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount} unread • {notifications.length} total
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={showFCMToken} style={styles.tokenButton}>
              <Text style={styles.tokenButtonText}>FCM Token</Text>
            </TouchableOpacity>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={clearAllNotifications} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={64} color="#666" />
              <Text style={styles.emptyStateTitle}>No FCM Notifications</Text>
              <Text style={styles.emptyStateText}>
                Real-time FCM notifications from your smart home devices will appear here.
                {'\n\n'}
                To test FCM notifications:
                {'\n'}
                1. Tap "FCM Token" above to get your device token
                {'\n'}
                2. Go to Firebase Console → Cloud Messaging
                {'\n'}
                3. Send a test notification with the token
                {'\n\n'}
                Example notification data:
                {'\n'}
                alertName: "Temperature Alert"
                {'\n'}
                deviceId: "TEMP_001"
                {'\n'}
                reason: "Temperature exceeded 25°C"
                {'\n'}
                severity: "high"
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.isRead && styles.unreadCard,
                ]}
                onPress={() => markAsRead(notification.id)}
              >
                <View style={styles.notificationHeader}>
                  <View style={[
                    styles.severityIndicator,
                    { backgroundColor: getSeverityColor(notification.severity) }
                  ]}>
                    <Ionicons
                      name={getSeverityIcon(notification.severity) as any}
                      size={20}
                      color="white"
                    />
                  </View>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.alertName}>{notification.alertName}</Text>
                    <Text style={styles.deviceId}>Device: {notification.deviceId}</Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timestamp}>{formatTime(notification.timestamp)}</Text>
                    {!notification.isRead && <View style={styles.unreadDot} />}
                  </View>
                </View>
                <Text style={styles.reason}>{notification.reason}</Text>
                <View style={styles.notificationFooter}>
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(notification.severity) + '20' }
                  ]}>
                    <Text style={[
                      styles.severityText,
                      { color: getSeverityColor(notification.severity) }
                    ]}>
                      {notification.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <BottomNavigation
          activeIndex={activeTab}
          onTabPress={setActiveTab}
        />
      </View>
    </SmartHomeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerButtons: {
    position: 'absolute',
    right: 20,
    top: 16,
    flexDirection: 'row',
    gap: 8,
  },
  tokenButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tokenButtonText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unreadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  severityIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  alertName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginTop: 4,
  },
  reason: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});