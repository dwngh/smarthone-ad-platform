// @ts-ignore
import { Client, Message } from 'paho-mqtt';

export interface MQTTSensorData {
  timestamp: string;
  id: string;
  value: number;
}

export class MQTTService {
  private client: any;
  private isConnected = false;
  private subscribers: Map<string, (data: MQTTSensorData) => void> = new Map();

  constructor(
    private brokerHost: string = 'broker.hivemq.com',
    private brokerPort: number = 8000, // WebSocket port for mobile apps
    private salt: string = '333333333333333333333333333333333987',
    private clientId: string = 'home-gateway-' + salt
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create MQTT client for React Native (requires WebSocket path)
        this.client = new Client(this.brokerHost, this.brokerPort, this.clientId);
        console.log('MQTT Client created with ID:', this.clientId);
        console.log('Connecting to MQTT broker:', this.brokerHost, 'Port:', this.brokerPort);
        
        // Set up connection options
        const connectOptions = {
          onSuccess: () => {
            console.log('MQTT Connected successfully to', this.brokerHost);
            this.isConnected = true;
            this.subscribeToDevices();
            resolve();
          },
          onFailure: (error: any) => {
            console.error('MQTT Connection failed:', error);
            console.error('Failed to connect to broker:', this.brokerHost, 'Port:', this.brokerPort);
            console.error('Error details:', JSON.stringify(error, null, 2));
            this.isConnected = false;
            reject(error);
          },
          keepAliveInterval: 60,
          cleanSession: true,
          useSSL: false,
          timeout: 10, // 10 seconds timeout
        };

        // Set up message handler
        this.client.onMessageArrived = (message: Message) => {
          this.handleMessage(message);
        };

        // Set up connection lost handler
        this.client.onConnectionLost = (responseObject: any) => {
          console.log('MQTT Connection lost:', responseObject.errorMessage);
          console.log('Connection lost details:', JSON.stringify(responseObject, null, 2));
          this.isConnected = false;
          
          // Auto-reconnect after 3 seconds
          console.log('Attempting to reconnect in 3 seconds...');
          setTimeout(() => {
            if (!this.isConnected) {
              console.log('Starting reconnection attempt...');
              this.connect().catch(err => {
                console.error('Reconnection failed:', err);
              });
            }
          }, 3000);
        };

        // Connect to broker
        console.log('Initiating MQTT connection with options:', JSON.stringify(connectOptions, null, 2));
        this.client.connect(connectOptions);
      } catch (error) {
        console.error('MQTT Connection error:', error);
        console.error('Error creating MQTT client or connecting:', JSON.stringify(error, null, 2));
        reject(error);
      }
    });
  }

  private subscribeToDevices() {
    if (this.isConnected) {
      const topic = '/home_1/devices';
      this.client.subscribe(topic);
      console.log(`MQTT Subscribed to topic: ${topic}`);
    }
  }

  private handleMessage(message: Message) {
    try {
      const topic = message.destinationName;
      const payload = message.payloadString;
      
      console.log(`MQTT Message received from ${topic}:`, payload);
      
      if (topic === '/home_1/devices') {
        const sensorData: MQTTSensorData = JSON.parse(payload);
        
        // Notify all subscribers about the new data
        this.subscribers.forEach((callback) => {
          callback(sensorData);
        });
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  }

  subscribe(id: string, callback: (data: MQTTSensorData) => void) {
    this.subscribers.set(id, callback);
  }

  unsubscribe(id: string) {
    this.subscribers.delete(id);
  }

  disconnect() {
    if (this.client && this.isConnected) {
      this.client.disconnect();
      this.isConnected = false;
      console.log('MQTT Disconnected');
    }
  }

}

export const mqttService = new MQTTService();