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
 * @description Main navigation entry point.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MainFlow } from './StackedFlows';

const Stack = createStackNavigator();

export const AppRouter = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainFlow} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
