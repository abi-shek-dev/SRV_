import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config/api';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and return the Expo push token
 */
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('[Push] Must use physical device for push notifications');
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted');
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    const token = tokenData.data;
    console.log('[Push] Token:', token);

    // Android-specific notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
        sound: 'default',
      });
    }

    return token;
  } catch (error) {
    console.error('[Push] Token error:', error);
    return null;
  }
}

/**
 * Send push token to backend
 */
export async function savePushTokenToServer(authToken, pushToken) {
  if (!pushToken) return;
  try {
    await axios.post(
      `${API_URL}/api/auth/push-token`,
      { token: pushToken },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('[Push] Token saved to server');
  } catch (error) {
    console.error('[Push] Failed to save token:', error.message);
  }
}

/**
 * Remove push token from server (on logout)
 */
export async function removePushTokenFromServer(authToken) {
  try {
    await axios.delete(`${API_URL}/api/auth/push-token`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('[Push] Token removed from server');
  } catch (error) {
    console.error('[Push] Failed to remove token:', error.message);
  }
}

/**
 * Add notification received listener
 */
export function addNotificationListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps on notification)
 */
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
