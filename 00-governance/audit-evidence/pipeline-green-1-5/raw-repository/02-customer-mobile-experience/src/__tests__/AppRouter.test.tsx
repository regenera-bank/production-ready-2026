import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppRouter } from '../AppRouter'; // Supondo que a stack esteja centralizada aqui

// Mock das telas principais para evitar renderização pesada e chamadas nativas
jest.mock('../screens/LoginScreen', () => {
  const { View, Text } = require('react-native');
  return () => (
    <View testID="login-screen">
      <Text>Login Screen</Text>
    </View>
  );
});

jest.mock('../screens/HomeScreen', () => {
  const { View, Text } = require('react-native');
  return () => (
    <View testID="home-screen">
      <Text>Home Screen</Text>
    </View>
  );
});

describe('AppRouter (React Native Navigation)', () => {
  it('Deve inicializar a Stack Navigation e renderizar a tela inicial de Auth', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <AppRouter />
      </NavigationContainer>
    );

    // Na primeira montagem, o roteador deve cair na tela de Login (Stack Padrão não autenticada)
    expect(getByTestId('login-screen')).toBeTruthy();
  });
});
