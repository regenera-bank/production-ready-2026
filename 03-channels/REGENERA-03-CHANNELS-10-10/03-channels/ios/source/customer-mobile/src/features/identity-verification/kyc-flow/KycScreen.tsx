/**
 * @meta Domain: Mobile / KYC
 * @description KYC onboarding flow hub.
 */

import React from 'react';
import { View, Text, Button } from 'react-native';

export const KycScreen = ({ navigation }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
    <Text style={{ fontSize: 20, marginBottom: 20 }}>Complete your Verification</Text>
    <Button title="Step 1: Document Capture" onPress={() => navigation.navigate('DocCapture')} />
    <Button title="Step 2: Selfie" onPress={() => navigation.navigate('Selfie')} />
  </View>
);
