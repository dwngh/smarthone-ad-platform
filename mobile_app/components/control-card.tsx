import { MQTTSensorData, mqttService } from '@/services/mqttService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface SensorData {
  timestamp: string;
  id: string;
  value: number;
}

interface SensorDevice {
  device_id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  unit: string;
  iconBackgroundColor: string;
  iconColor: string;
  data: SensorData;
}

interface SensorCardProps {
  device: SensorDevice;
  onPress?: () => void;
}

export function SensorCard({ device, onPress }: SensorCardProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getStatusColor = (value: number) => {
    // Color coding based on sensor value ranges
    if (value < 30) return '#10b981'; // Green - Good
    if (value < 70) return '#f59e0b'; // Yellow - Warning  
    return '#ef4444'; // Red - Critical
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        minHeight: 80
      }}
    >
      <View 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        {/* Left side - Icon and info */}
        <View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            flex: 1,
            marginRight: 12
          }}
        >
          <View 
            style={{ 
              backgroundColor: device.iconBackgroundColor,
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}
          >
            <Ionicons name={device.icon} size={24} color={device.iconColor} />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text 
              style={{
                color: '#111827',
                fontSize: 15,
                fontWeight: '600',
                marginBottom: 2
              }}
              numberOfLines={1}
            >
              {device.name}
            </Text>
            <Text 
              style={{
                color: '#6b7280',
                fontSize: 11,
                marginBottom: 1
              }}
            >
              ID: {device.device_id}
            </Text>
            <Text 
              style={{
                color: '#9ca3af',
                fontSize: 10
              }}
            >
              {formatTimestamp(device.data.timestamp)}
            </Text>
          </View>
        </View>

        {/* Right side - Value display */}
        <View 
          style={{ 
            alignItems: 'flex-end',
            justifyContent: 'center',
            minWidth: 60
          }}
        >
          <Text 
            style={{
              color: getStatusColor(device.data.value),
              fontSize: 20,
              fontWeight: 'bold'
            }}
          >
            {Math.round(device.data.value)}
          </Text>
          <Text 
            style={{
              color: '#6b7280',
              fontSize: 11,
              marginTop: 1
            }}
          >
            {device.unit}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function MainControlSection() {
  // Initialize sensors with default device configurations
  const [sensorDevices, setSensorDevices] = useState<SensorDevice[]>([
    {
      device_id: "temp1",
      name: "Living Room Temperature",
      icon: "thermometer-outline",
      unit: "°C",
      iconBackgroundColor: "#dbeafe",
      iconColor: "#3b82f6",
      data: {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 23),
        id: "temp1",
        value: 0
      }
    },
    {
      device_id: "humidity1", 
      name: "Living room Humidity",
      icon: "water-outline",
      unit: "%RH",
      iconBackgroundColor: "#dcfce7",
      iconColor: "#16a34a",
      data: {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 23),
        id: "humidity1",
        value: 0
      }
    },
    {
      device_id: "luminosity1",
      name: "Living room Light Sensor",
      icon: "sunny-outline", 
      unit: "lux",
      iconBackgroundColor: "#fef3c7",
      iconColor: "#f59e0b",
      data: {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 23),
        id: "luminosity1",
        value: 0
      }
    },
    {
      device_id: "motion1",
      name: "Living room Motion Area Sensor",
      icon: "walk-outline", 
      unit: "",
      iconBackgroundColor: "#fdf2f8",
      iconColor: "#ec4899",
      data: {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 23),
        id: "motion1",
        value: 0
      }
    }
  ]);

  // Connection status
  const [mqttConnected, setMqttConnected] = useState(false);

  // MQTT setup and real-time updates
  useEffect(() => {
    // Initialize MQTT connection
    const initMQTT = async () => {
      try {
        await mqttService.connect();
        setMqttConnected(true);
        
        // Subscribe to MQTT sensor data updates
        mqttService.subscribe('sensor-updates', (mqttData: MQTTSensorData) => {
          console.log('Received MQTT sensor data:', mqttData);
          
          // Update the corresponding sensor device
          setSensorDevices(prevDevices => 
            prevDevices.map(device => {
              if (device.device_id === mqttData.id) {
                return {
                  ...device,
                  data: {
                    timestamp: mqttData.timestamp,
                    id: mqttData.id,
                    value: mqttData.value
                  }
                };
              }
              return device;
            })
          );
        });
        
      } catch (error) {
        console.error('Failed to connect to MQTT broker:', error);
        setMqttConnected(false);
        
        // Fall back to simulation for testing
        console.log('Falling back to simulated data...');
      }
    };


    initMQTT();

    // Cleanup on unmount
    return () => {
      mqttService.unsubscribe('sensor-updates');
      mqttService.disconnect();
    };
  }, []);

  return (
    <View 
      style={{
        flex: 1,
        paddingHorizontal: 4,
        paddingTop: 8
      }}
    >
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginBottom: 12,
        marginTop: 8
      }}>
        <Text 
          style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold'
          }}
        >
          Sensor Devices
        </Text>
        
        {/* MQTT Connection Status */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          backgroundColor: mqttConnected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: mqttConnected ? '#22c55e' : '#ef4444',
            marginRight: 6
          }} />
          <Text style={{
            color: 'white',
            fontSize: 11,
            fontWeight: '500'
          }}>
            {mqttConnected ? 'MQTT Connected' : 'MQTT Offline'}
          </Text>
        </View>
      </View>
      
      <ScrollView 
        style={{ 
          flex: 1 
        }}
        contentContainerStyle={{
          paddingBottom: 20
        }}
        showsVerticalScrollIndicator={false}
      >
        {sensorDevices.map((device) => (
          <SensorCard
            key={device.device_id}
            device={device}
            onPress={() => {
              console.log(`Sensor pressed: ${device.device_id}`, JSON.stringify(device.data, null, 2));
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}