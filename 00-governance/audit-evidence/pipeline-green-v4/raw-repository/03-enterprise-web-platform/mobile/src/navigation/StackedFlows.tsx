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
 * @meta Domain: Mobile / Navigation
 * @description Definition of stacked navigation flows.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PixScreen } from '../features/transfer-flow/PixScreen';
import { KycScreen } from '../features/kyc-flow/KycScreen';

const Stack = createStackNavigator();

export const MainFlow = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={EmptyPlaceholder} />
    <Stack.Screen name="Pix" component={PixScreen} />
    <Stack.Screen name="KYC" component={KycScreen} />
  </Stack.Navigator>
);

const EmptyPlaceholder = () => null;
