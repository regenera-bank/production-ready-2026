/**
 * @meta Domain: Mobile / Notifications
 * @description Local notification alerts.
 */

import notifee from '@notifee/react-native';

export const showLocalAlert = async (title: string, body: string) => {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });

  await notifee.displayNotification({
    title,
    body,
    android: { channelId },
  });
};
