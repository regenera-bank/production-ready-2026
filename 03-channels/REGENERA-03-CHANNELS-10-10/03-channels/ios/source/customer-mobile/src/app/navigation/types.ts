import React from 'react';

/**
 * Enterprise Navigation Types
 * Define as rotas do aplicativo de forma estrita para evitar o uso de 'any'.
 */
export type RootStackParamList = {
  Kyc: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Pix: undefined;
  Transfer: undefined;
  NeuralCore: undefined;
  Profile: undefined;
  Notifications: undefined;
  OpenFinance: undefined;
  Investments: undefined;
  Marketplace: undefined;
  Security: undefined;
  Tax: undefined;
  Kids: undefined;
};

export type MainTabParamList = {
  Extrato: undefined;
  Menu: undefined;
  Home: undefined;
  Spacer: undefined;
  Cartoes: undefined;
};

// Extensões globais para o React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
