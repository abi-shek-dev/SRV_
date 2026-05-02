import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { addNotificationListener, addNotificationResponseListener } from './src/utils/pushNotifications';

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = addNotificationListener(notification => {
      console.log('[Notification Received]', notification.request.content.title);
    });

    // Listen for notification taps (user interaction)
    responseListener.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;
      console.log('[Notification Tapped]', data);
      // Future: navigate to specific screen based on data.type
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
