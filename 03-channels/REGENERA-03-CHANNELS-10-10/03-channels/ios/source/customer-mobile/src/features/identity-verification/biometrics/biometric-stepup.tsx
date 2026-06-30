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
