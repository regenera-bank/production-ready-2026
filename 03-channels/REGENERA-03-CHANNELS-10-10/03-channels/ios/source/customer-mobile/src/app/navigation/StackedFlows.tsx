/**
 * @meta Domain: Mobile / Navigation
 * @description Definition of stacked navigation flows.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PixScreen from '../../features/payments/pix/ui/PixScreen';
import KycScreen from '../../features/identity-verification/ui/KycScreen';

const Stack = createStackNavigator();

export const MainFlow = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={EmptyPlaceholder} />
    <Stack.Screen name="Pix" component={PixScreen} />
    <Stack.Screen name="KYC" component={KycScreen} />
  </Stack.Navigator>
);

const EmptyPlaceholder = () => null;
