import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface BottomNavItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive?: boolean;
  onPress?: () => void;
}

function BottomNavItem({ icon, label, isActive = false, onPress }: BottomNavItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12
      }}
    >
      <Ionicons 
        name={icon} 
        size={28} 
        color={isActive ? "#ffffff" : "#ffffff80"} 
      />
      <Text
        style={{
          fontSize: 12,
          marginTop: 4,
          color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
          fontWeight: '500'
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface BottomNavigationProps {
  activeIndex?: number;
  onTabPress?: (index: number) => void;
}

export function BottomNavigation({ activeIndex = 0, onTabPress }: BottomNavigationProps) {
  const tabs = [
    { icon: 'home-outline' as const, label: 'Home', route: '/' as const },
    { icon: 'warning-outline' as const, label: 'Alerts', route: '/alert' as const },
    // { icon: 'settings-outline' as const, label: 'FCM Test', route: '/explore' as const },
  ];

  return (
    <View 
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}
    >
      <View 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
          paddingBottom: 32
        }}
      >
        {tabs.map((tab, index) => (
          <BottomNavItem
            key={index}
            icon={tab.icon}
            label={tab.label}
            isActive={activeIndex === index}
            onPress={() => {
              onTabPress?.(index);
              router.push(tab.route);
            }}
          />
        ))}
      </View>
    </View>
  );
}