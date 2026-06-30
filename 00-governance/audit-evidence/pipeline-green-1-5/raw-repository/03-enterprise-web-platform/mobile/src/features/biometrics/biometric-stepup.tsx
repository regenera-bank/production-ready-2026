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
 * @meta Domain: Mobile / Biometrics
 * @description Step-up authentication UI component.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BiometricService } from './native-auth.service';

export const BiometricStepup = ({ onVerified }: { onVerified: () => void }) => {
  const handleVerify = async () => {
    const success = await BiometricService.promptAuth('Confirm identity to proceed');
    if (success) onVerified();
  };

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text>Secure Operation</Text>
      <TouchableOpacity onPress={handleVerify}>
        <Text>Verify with Biometrics</Text>
      </TouchableOpacity>
    </View>
  );
};
