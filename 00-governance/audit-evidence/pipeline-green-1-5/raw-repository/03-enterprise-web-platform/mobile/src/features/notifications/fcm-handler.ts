/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

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
