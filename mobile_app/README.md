# Smart Home Gateway Mobile App 🏠

A minimalist smart home mobile app built with React Native, Expo Router, and Firebase Cloud Messaging (FCM). Features real-time sensor data via MQTT and push notifications for device alerts.

## Features

- 🎨 **Minimalist Dark UI** - Clean, modern interface with gradient backgrounds
- 📱 **Real-time Notifications** - FCM integration for foreground, background, and killed app states
- 📊 **Sensor Dashboard** - Live sensor data (temperature, humidity, light) via MQTT
- 🔔 **Alert System** - Comprehensive notification management with severity levels
- 🌐 **MQTT Integration** - Real-time communication with IoT devices

## Prerequisites

- Node.js 18+ and npm
- Android Studio with Android SDK
- Android device or emulator
- Firebase project with Cloud Messaging enabled

## Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Install Firebase packages** (already included in package.json)

   ```bash
   npm install @react-native-firebase/app @react-native-firebase/messaging
   ```

## Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named `homegateway-4c521` (or use existing)
3. Enable **Cloud Messaging** in the project

### 2. Add Android App to Firebase

1. In Firebase Console, click "Add app" → Android
2. Use package name: `com.iotlab.homegateway`
3. Download `google-services.json`
4. Place it in `android/app/google-services.json`

### 3. Configure Android Build Files

The project is already configured with the following changes:

#### `android/build.gradle` (Project-level)
```gradle
buildscript {
  dependencies {
    // ... other dependencies
    classpath('com.google.gms:google-services:4.4.3')  // Added
  }
}
```

#### `android/app/build.gradle` (App-level)
```gradle
apply plugin: "com.google.gms.google-services"  // Added

android {
    namespace 'com.iotlab.homegateway'
    defaultConfig {
        applicationId 'com.iotlab.homegateway'  // Updated from default
        // ... other config
    }
}

dependencies {
    // Firebase BOM and Analytics
    implementation platform("com.google.firebase:firebase-bom:34.3.0")
    implementation "com.google.firebase:firebase-analytics"
}
```

## Updating demo hardcoded values

This project ships with a few intentionally hardcoded demo values to make it easy to run locally. To adapt the demo to your own environment, edit the files below.

1) `components/control-card.tsx`
   - What to change: the initial sensor devices array in `MainControlSection`.
   - Current device IDs: `temp1` (temperature), `humidity1` (humidity), `luminosity1` (light), `motion1` (motion)
   - Fields: `device_id`, `name`, `icon`, `unit`, `iconBackgroundColor`, `iconColor`, and the `data` initial values (`timestamp`, `id`, `value`).
   - Location: edit the `useState<SensorDevice[]>([ ... ])` initializer near the top of `MainControlSection`.
   - Motion sensor: Uses `walk-outline` icon and empty unit string, values 0/1 for no motion/motion detected.

2) `services/mqttService.ts`
   - What to change: MQTT connection defaults and topics.
   - Fields: constructor defaults `brokerHost` (default `broker.hivemq.com`), `brokerPort` (default `8000`), `salt` (used to form the `clientId`), and `clientId` (optional override).
   - Topics: update the hardcoded topic in `subscribeToDevices()` (currently `/home_1/devices`).

3) `components/fcm-test-panel.tsx`
   - What to change: demo FCM topic names used in the subscribe/unsubscribe examples (e.g., `'test_topic'`).

4) `services/fcmService.ts`
   - What to change: any example/commented `subscribeToTopic` calls and the navigation helpers (`navigateToScreen`, `navigateToDevice`) so they match your routing.

5) `android/app/google-services.json`
   - What to change: replace with the `google-services.json` file from your Firebase Android app (matching `applicationId`).

Tips
- Use `broker.hivemq.com` and topic `/home_1/devices` for quick public testing, or run your own Mosquitto/Hivemq server for a private setup.
- For predictable MQTT behavior, set a stable `clientId` in `MQTTService` instead of relying on a random `salt` default.
- Keep the MQTT/FCM message payload shapes consistent between your devices/backend and the example shapes in the app.

## Running the App

### Android Development

**Important**: Use `npm run android` to run on Android (not `npm start`)

```bash
# Build and run on Android device/emulator
npm run android
```

This command:
- Builds the native Android app with Firebase integration
- Installs on connected device/emulator
- Starts Metro bundler on available port (8081, 8082, etc.)

## Testing MQTT Communication

### 1. Using MQTT.fx Client (Recommended)

1. **Download MQTT.fx** from [mqttfx.jensd.de](https://mqttfx.jensd.de/)
2. **Configure Connection**:
   - **Profile Name**: `HiveMQ Public`
   - **Broker Address**: `broker.hivemq.com`
   - **Broker Port**: `1883`
   - **Client ID**: `mqtt_test_client`

3. **Connect and Test**:
   - Click **Connect** button
   - Navigate to **Publish** tab
   - Set topic: `/home_1/devices`
   - Publish test sensor data (see examples below)

### 2. Using Mosquitto Command Line

Install Mosquitto MQTT broker tools:

```bash
# Windows (using Chocolatey)
choco install mosquitto

# macOS (using Homebrew)
brew install mosquitto

# Ubuntu/Debian
sudo apt-get install mosquitto-clients
```

**Publish test data**:
```bash
# Temperature sensor data (Living Room)
mosquitto_pub -h broker.hivemq.com -t "/home_1/devices" -m '{"timestamp":"2025-10-01T10:30:00Z","id":"temp1","value":23.5}'

# Humidity sensor data (Living Room)
mosquitto_pub -h broker.hivemq.com -t "/home_1/devices" -m '{"timestamp":"2025-10-01T10:31:00Z","id":"humidity1","value":65.2}'

# Light sensor data (Living Room)
mosquitto_pub -h broker.hivemq.com -t "/home_1/devices" -m '{"timestamp":"2025-10-01T10:32:00Z","id":"luminosity1","value":850}'

# Motion sensor data (Living Room)
mosquitto_pub -h broker.hivemq.com -t "/home_1/devices" -m '{"timestamp":"2025-10-01T10:33:00Z","id":"motion1","value":1}'
```

### 3. Test Data Examples

#### Temperature Sensor (temp1) - Living Room
```json
{
  "timestamp": "2025-10-01T10:30:00Z",
  "id": "temp1",
  "value": 23.5
}
```

#### Humidity Sensor (humidity1) - Living Room
```json
{
  "timestamp": "2025-10-01T10:31:00Z", 
  "id": "humidity1",
  "value": 65.2
}
```

#### Light Sensor (luminosity1) - Living Room
```json
{
  "timestamp": "2025-10-01T10:32:00Z",
  "id": "luminosity1", 
  "value": 850
}
```

#### Motion Sensor (motion1) - Living Room
```json
{
  "timestamp": "2025-10-01T10:33:00Z",
  "id": "motion1", 
  "value": 1
}
```

### 4. Using Online MQTT Client

1. Visit [HiveMQ WebSocket Client](http://www.hivemq.com/demos/websocket-client/)
2. **Connection Settings**:
   - **Host**: `broker.hivemq.com`
   - **Port**: `8000` (WebSocket)
   - **Client ID**: `web_test_client`
3. Click **Connect**
4. **Publish Messages**:
   - **Topic**: `/home_1/devices`
   - **Message**: Use JSON examples above

### 5. Testing Steps

1. **Start the mobile app** on your Android device/emulator
2. **Navigate to Home tab** to see the sensor dashboard
3. **Publish MQTT messages** using any method above
4. **Observe real-time updates** in the app:
   - Temperature card should update with temp1 data
   - Humidity card should update with humidity1 data  
   - Light card should update with luminosity1 data
   - Motion card should update with motion1 data

### 6. Custom Device Testing

To test with your own device IDs, update the sensor configuration in `components/control-card.tsx`:

```typescript
const [sensorDevices, setSensorDevices] = useState<SensorDevice[]>([
  {
    device_id: 'YOUR_TEMP_ID',    // Change this (current: temp1)
    name: 'Your Temperature Sensor',
    icon: 'thermometer-outline',
    unit: '°C',
    iconBackgroundColor: '#dbeafe',
    iconColor: '#3b82f6',
    // ... rest of config
  },
  {
    device_id: 'YOUR_HUMIDITY_ID',  // Change this (current: humidity1)
    name: 'Your Humidity Sensor',
    icon: 'water-outline',
    unit: '%RH',
    // ... rest of config
  },
  {
    device_id: 'YOUR_LIGHT_ID',     // Change this (current: luminosity1)
    name: 'Your Light Sensor', 
    icon: 'sunny-outline',
    unit: 'lux',
    // ... rest of config
  },
  {
    device_id: 'YOUR_MOTION_ID',    // Change this (current: motion1)
    name: 'Your Motion Sensor',
    icon: 'walk-outline',
    unit: '',
    // ... rest of config
  }
]);
```

Then publish MQTT messages with your custom device ID:
```bash
mosquitto_pub -h broker.hivemq.com -t "/home_1/devices" -m '{"timestamp":"2025-10-01T10:30:00Z","id":"YOUR_TEMP_ID","value":25.0}'
```

### 7. Troubleshooting MQTT

#### Common Issues
- **Connection Issues**: Check if `broker.hivemq.com:8000` is accessible
- **No Data Updates**: Verify device IDs match between MQTT messages and app configuration (temp1, humidity1, luminosity1, motion1)
- **Invalid JSON**: Ensure MQTT payload is valid JSON format
- **Topic Mismatch**: Confirm topic is exactly `/home_1/devices`
- **Motion Sensor Values**: Use 0 for no motion, 1 for motion detected

#### Release Build Issues

**Problem**: MQTT and FCM work in debug mode but fail in release APK.

**Root Causes**:
1. **Network Security Policy**: Release builds block cleartext traffic by default
2. **Code Obfuscation**: R8/ProGuard removes Firebase and MQTT classes
3. **Missing Permissions**: FCM requires specific permissions and services
4. **Package Name Mismatch**: Firebase config must match exact package name

**Solutions Applied**:

1. **Network Security Configuration**: 
   - Allow HTTPS for Firebase services (`firebase.googleapis.com`, `fcm.googleapis.com`)
   - Allow cleartext traffic for MQTT brokers (`broker.hivemq.com`)

2. **AndroidManifest.xml**: 
   - Added FCM permissions (`WAKE_LOCK`, `C2D_MESSAGE`)
   - Added FCM service configuration
   - Added notification metadata
   - Enabled cleartext traffic and network security config

3. **ProGuard Rules**: 
   - Added keep rules for Firebase classes (`com.google.firebase.**`)
   - Added keep rules for React Native Firebase (`io.invertase.firebase.**`)
   - Added keep rules for MQTT Paho client classes

4. **Enhanced Logging**: Added detailed error logging for both MQTT and FCM

**Files Modified**:
- `android/app/src/main/res/xml/network_security_config.xml` (created/updated)
- `android/app/src/main/AndroidManifest.xml` (updated with FCM config)
- `android/app/proguard-rules.pro` (updated with Firebase rules)
- `services/mqttService.ts` (enhanced logging)

**Build Release APK**:
```bash
cd android
./gradlew assembleRelease
```

**Install Release APK**:
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

**Debug Release Issues**:
```bash
# View logs from release APK
adb logcat | grep -E "(MQTT|WebSocket|Network|FCM|Firebase)"
```

## Preventing FCM and MQTT Blocking in Release Builds

When you build a release APK, Android applies strict security policies and code optimization that can block FCM and MQTT functionality. Here are all the necessary changes to prevent this:

### 1. Network Security Configuration

Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Firebase and Google Services - allow HTTPS -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">firebase.googleapis.com</domain>
        <domain includeSubdomains="true">fcm.googleapis.com</domain>
        <domain includeSubdomains="true">googleapis.com</domain>
        <domain includeSubdomains="true">google.com</domain>
        <domain includeSubdomains="true">android.googleapis.com</domain>
    </domain-config>
    
    <!-- MQTT brokers - allow cleartext -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">broker.hivemq.com</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.0.0/8</domain>
        <domain includeSubdomains="true">192.168.0.0/16</domain>
    </domain-config>
    
    <!-- Default config - allow cleartext for development -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>
```

### 2. AndroidManifest.xml Updates

Update `android/app/src/main/AndroidManifest.xml`:

**Add namespace and permissions:**
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
          xmlns:tools="http://schemas.android.com/tools">
  <!-- Existing permissions -->
  <uses-permission android:name="android.permission.INTERNET"/>
  <!-- Add these FCM permissions -->
  <uses-permission android:name="android.permission.WAKE_LOCK"/>
  <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE"/>
  <permission android:name="com.iotlab.homegateway.permission.C2D_MESSAGE" 
              android:protectionLevel="signature"/>
  <uses-permission android:name="com.iotlab.homegateway.permission.C2D_MESSAGE"/>
```

**Update application tag:**
```xml
<application android:name=".MainApplication" 
             android:usesCleartextTraffic="true" 
             android:networkSecurityConfig="@xml/network_security_config"
             ... other attributes ...>
    
    <!-- Add FCM Configuration -->
    <meta-data android:name="com.google.firebase.messaging.default_notification_icon" 
               android:resource="@mipmap/ic_launcher" 
               tools:replace="android:resource"/>
    <meta-data android:name="com.google.firebase.messaging.default_notification_color" 
               android:resource="@android:color/white" 
               tools:replace="android:resource"/>
    <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" 
               android:value="default_channel" 
               tools:replace="android:value"/>
    
    <!-- Add FCM Service -->
    <service android:name="io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService" 
             android:exported="false">
      <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT"/>
      </intent-filter>
    </service>
```

### 3. ProGuard Rules Updates

Update `android/app/proguard-rules.pro`:

```proguard
# Firebase and FCM - prevent obfuscation
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class io.invertase.firebase.** { *; }
-keep class com.google.firebase.messaging.** { *; }
-keep class com.google.firebase.iid.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**
-dontwarn io.invertase.firebase.**

# React Native Firebase specific
-keep class io.invertase.firebase.messaging.** { *; }
-keep class io.invertase.firebase.app.** { *; }

# MQTT Paho client - prevent obfuscation
-keep class org.eclipse.paho.** { *; }
-keep class org.eclipse.paho.client.mqttv3.** { *; }
-dontwarn org.eclipse.paho.**

# WebSocket support for MQTT
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Keep JavaScript interface classes
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep React Native bridge methods
-keepclassmembers class com.facebook.react.bridge.** { *; }
```

### 4. Common Issues and Solutions

**Issue: "Manifest merger failed with multiple errors"**
- **Cause**: React Native Firebase already includes FCM metadata
- **Solution**: Add `tools:replace` attributes to override existing values
- **Fix**: Use the AndroidManifest.xml configuration above with `xmlns:tools` namespace

**Issue: "Network request failed" in release**
- **Cause**: Android blocks cleartext traffic by default
- **Solution**: Configure network security policy
- **Fix**: Create the `network_security_config.xml` file above

**Issue: "Firebase classes not found" in release**
- **Cause**: R8/ProGuard removes Firebase classes during minification
- **Solution**: Add keep rules for Firebase classes
- **Fix**: Update `proguard-rules.pro` as shown above

**Issue: "MQTT connection timeout" in release**
- **Cause**: WebSocket classes are obfuscated/removed
- **Solution**: Add keep rules for OkHttp and Paho MQTT
- **Fix**: Include MQTT-specific ProGuard rules above

### 5. Verification Steps

After making these changes:

1. **Clean and rebuild:**
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

2. **Install release APK:**
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

3. **Test FCM:**
   - Get FCM token from app
   - Send test notification via Firebase Console
   - Verify notification appears

4. **Test MQTT:**
   - Send MQTT message using mosquitto or MQTT.fx
   - Verify sensor data updates in app

5. **Monitor logs:**
```bash
adb logcat | grep -E "(FCM|Firebase|MQTT|WebSocket)"
```

### 6. Security Notes

- **FCM**: Uses HTTPS by default - secure for production
- **MQTT**: Configure with SSL/TLS for production use
- **Development**: Current config allows cleartext for testing
- **Production**: Consider using WSS (WebSocket Secure) for MQTT

### 7. Alternative MQTT Configurations

For production environments, consider:
```javascript
// Use secure WebSocket for MQTT
const mqttClient = new Client('your-mqtt-broker.com', 8084, clientId); // WSS port
// Or use native TCP with SSL
const mqttClient = new Client('your-mqtt-broker.com', 8883, clientId); // SSL port
```

## Testing FCM Notifications

### 1. Get FCM Token

1. Open the app on Android device
2. Navigate to **Alerts** tab
3. Tap **"FCM Token"** button
4. Copy the displayed token

### 2. Send Test Notification

1. Go to [Firebase Console](https://console.firebase.google.com/) → Cloud Messaging
2. Click **"Send your first message"**
3. Enter notification details:
   - **Title**: "Temperature Alert"
   - **Body**: "High temperature detected"
4. Click **Next** → **Send test message**
5. Paste your FCM token and send

### 3. Test Different App States

- **Foreground**: App open and active - shows in-app alert
- **Background**: App minimized - shows system notification
- **Killed**: App closed completely - shows system notification

### 4. Custom Data Format

For smart home alerts, include this data in Firebase Console:

```json
{
  "alertName": "Temperature Alert",
  "deviceId": "TEMP_001", 
  "reason": "Temperature exceeded 25°C",
  "severity": "high"
}
```

## Project Structure

```
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home screen with sensor dashboard
│   │   ├── alert.tsx          # FCM notifications display
│   │   └── _layout.tsx        # Tab navigation with NotificationProvider
├── components/
│   ├── smart-home-background.tsx  # Gradient background
│   ├── control-card.tsx       # Sensor device cards
│   └── fcm-test-panel.tsx     # FCM testing utilities
├── contexts/
│   └── NotificationContext.tsx    # FCM state management
├── services/
│   ├── fcmService.ts          # Firebase messaging service
│   └── mqttService.ts         # MQTT client for sensors
└── android/
    ├── app/
    │   ├── build.gradle       # App-level build config
    │   └── google-services.json  # Firebase configuration
    └── build.gradle           # Project-level build config
```

## Key Configuration Files

### Package Configuration

- **Application ID**: `com.iotlab.homegateway`
- **Package Name**: `home-gateway-mobile-app`
- **Firebase Project**: `homegateway-4c521`

### Dependencies

- **Firebase**: `@react-native-firebase/app@23.4.0`, `@react-native-firebase/messaging@23.4.0`
- **MQTT**: `paho-mqtt@1.1.0` for IoT device communication
- **Navigation**: `expo-router@6.0.8` for file-based routing
- **UI**: `@expo/vector-icons`, `expo-linear-gradient`

## Development

The app uses:
- **Expo Router** for navigation
- **TypeScript** for type safety
- **React Context** for state management
- **MQTT over WebSocket** for real-time data
- **FCM** for push notifications

Edit files in the `app/` directory to start developing. The project uses file-based routing.

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)