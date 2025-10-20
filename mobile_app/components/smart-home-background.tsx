import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, SafeAreaView } from 'react-native';

interface SmartHomeBackgroundProps {
  children: React.ReactNode;
}

export function SmartHomeBackground({ children }: SmartHomeBackgroundProps) {
  return (
    <ImageBackground
      source={require('@/assets/images/smart-home-bg.jpg')}
      style={{ flex: 1 }}
      blurRadius={10}
    >
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.8)', 'rgba(30, 41, 59, 0.7)', 'rgba(51, 65, 85, 0.6)']}
        style={{ flex: 1 }}
      >
        <SafeAreaView 
          style={{ flex: 1 }}
        >
          {children}
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}