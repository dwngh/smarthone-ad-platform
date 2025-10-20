import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TopNavigationProps {
  title: string;
  onBackPress?: () => void;
  onPlusPress?: () => void;
  onMenuPress?: () => void;
}

export function TopNavigation({ title, onBackPress, onPlusPress, onMenuPress }: TopNavigationProps) {
  return (
    <View 
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 24, 
        paddingVertical: 16, 
        paddingTop: 48 
      }}
    >
      {/* Left side - Back arrow */}
      {/* <TouchableOpacity
        onPress={onBackPress}
        style={{ 
          width: 40, 
          height: 40, 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity> */}

      {/* Center/Left - Title */}
      <View 
        style={{ 
          flex: 1, 
          marginLeft: 16 
        }}
      >
        <Text 
          style={{ 
            color: 'white', 
            fontSize: 24, 
            fontWeight: 'bold' 
          }}
        >
          {title}
        </Text>
      </View>

      {/* Right side - Action icons */}
      {/* <View 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 16 
        }}
      >
        <TouchableOpacity
          onPress={onPlusPress}
          style={{ 
            width: 40, 
            height: 40, 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={onMenuPress}
          style={{ 
            width: 40, 
            height: 40, 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
      </View> */}
    </View>
  );
}