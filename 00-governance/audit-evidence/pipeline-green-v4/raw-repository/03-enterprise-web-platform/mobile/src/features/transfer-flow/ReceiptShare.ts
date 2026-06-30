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
 * @meta Domain: Mobile / Transfer
 * @description Logic for sharing transaction receipts.
 */

import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';

export const shareReceipt = async (viewRef: any) => {
  try {
    const uri = await ViewShot.captureRef(viewRef, { format: 'png' });
    await Share.open({ url: uri, message: 'Regenera Transaction Receipt' });
  } catch (err) {
    console.error('Error sharing receipt:', err);
  }
};
