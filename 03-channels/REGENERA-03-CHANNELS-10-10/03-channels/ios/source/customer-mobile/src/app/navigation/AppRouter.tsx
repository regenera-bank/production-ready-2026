/**
 * @meta Domain: Mobile / Navigation
 * @description Raiz do sistema de navegação do aplicativo.
 *
 * O projeto declara @react-navigation/native-stack. O import anterior usava
 * @react-navigation/stack, dependência ausente no lockfile e no package.json.
 * Navegação não pode depender de pacote implícito: build reproduzível começa
 * no contrato de dependências.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainFlow } from './StackedFlows';

const Stack = createNativeStackNavigator();

export const AppRouter = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainFlow} />
    </Stack.Navigator>
  </NavigationContainer>
);
