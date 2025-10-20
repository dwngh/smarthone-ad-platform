import { NotificationProvider } from '@/contexts/NotificationContext';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <NotificationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="alert" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ headerShown: false }} />
      </Stack>
    </NotificationProvider>
  );
}
