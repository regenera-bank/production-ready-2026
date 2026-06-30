/**
 * @meta Domain: Mobile / Notifications
 * @description Firebase Cloud Messaging handler.
 */

import messaging from '@react-native-firebase/messaging';

export const setupFCM = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;

  if (enabled) {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    // Send to backend
  }

  messaging().onMessage(async remoteMessage => {
    console.log('Foreground Message:', remoteMessage);
  });
};
