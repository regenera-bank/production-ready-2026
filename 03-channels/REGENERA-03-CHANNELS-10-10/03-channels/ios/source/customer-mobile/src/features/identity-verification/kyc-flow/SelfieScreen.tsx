/**
 * @meta Domain: Mobile / KYC
 * @description Selfie/Liveness capture screen.
 */

import React from 'react';
import { View } from 'react-native';
import { LivenessCapture } from '../capture/liveness-capture';

export const SelfieScreen = () => (
  <View style={{ flex: 1 }}>
    <LivenessCapture />
  </View>
);
