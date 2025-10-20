import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface StatusCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconColor?: string;
}

function StatusCard({ icon, label, value, iconColor = "#60a5fa" }: StatusCardProps) {
  return (
    <View 
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
        flex: 1,
        marginHorizontal: 4
      }}
    >
      <Ionicons name={icon} size={24} color={iconColor} />
      <Text 
        style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: 12,
          marginTop: 8,
          fontWeight: '500'
        }}
      >
        {label}
      </Text>
      <Text 
        style={{
          color: 'white',
          fontSize: 14,
          fontWeight: 'bold',
          marginTop: 4
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function StatusSection() {
  return (
    <View 
      style={{
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 16
      }}
    >
      <StatusCard 
        icon="water-outline" 
        label="Humidity" 
        value="65%" 
        iconColor="#60a5fa"
      />
      <StatusCard 
        icon="sunny-outline" 
        label="Light" 
        value="ON" 
        iconColor="#f59e0b"
      />
      <StatusCard 
        icon="contrast-outline" 
        label="Brightness" 
        value="80%" 
        iconColor="#10b981"
      />
    </View>
  );
}