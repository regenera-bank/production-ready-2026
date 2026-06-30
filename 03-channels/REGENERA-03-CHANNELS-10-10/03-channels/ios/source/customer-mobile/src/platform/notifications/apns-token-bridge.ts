/**
 * @meta Domain: Mobile / Notifications
 * @description iOS APNS token handling logic.
 */

import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export const handleAPNSToken = async () => {
  if (Platform.OS === 'ios') {
    const apnsToken = await messaging().getAPNSToken();
    console.log('APNS Token:', apnsToken);
    return apnsToken;
  }
  return null;
};
