import React, { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, View } from 'react-native';

import { BottomNavigation } from '@/components/bottom-navigation';
import { MainControlSection } from '@/components/control-card';
import { SmartHomeBackground } from '@/components/smart-home-background';
import { TopNavigation } from '@/components/top-navigation';
import fcmService from '@/services/fcmService';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState(0);

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Smart Home Notifications',
            message: 'Allow notifications to receive alerts from your smart home devices',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
        }
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
      }
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    
    // Initialize FCM service for all app states
    fcmService.initialize().then(() => {
      console.log('FCM service initialized');
      
      // Subscribe to general home automation topic
      // fcmService.subscribeToTopic('home_automation');
      // fcmService.subscribeToTopic('sensor_updates');
      // fcmService.subscribeToTopic('device_alerts');
    }).catch((error) => {
      console.error('FCM initialization failed:', error);
    });

    // Cleanup on unmount
    return () => {
      fcmService.cleanup();
    };
  }, []);

  return (
    <SmartHomeBackground>
      <View 
        style={{
          flex: 1
        }}
      >
        {/* Top Navigation */}
        <TopNavigation
          title="Smart Home"
          onBackPress={() => console.log('Back pressed')}
          onPlusPress={() => console.log('Add device pressed')}
          onMenuPress={() => console.log('Menu pressed')}
        />

        {/* Status Section */}
        {/* <StatusSection /> */}

        {/* Main Control Cards */}
        <MainControlSection />

        {/* Bottom Navigation */}
        <BottomNavigation
          activeIndex={activeTab}
          onTabPress={setActiveTab}
        />
      </View>
    </SmartHomeBackground>
  );
}
