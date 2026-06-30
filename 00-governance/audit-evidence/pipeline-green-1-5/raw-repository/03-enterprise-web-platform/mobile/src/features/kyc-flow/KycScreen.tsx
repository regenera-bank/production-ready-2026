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
