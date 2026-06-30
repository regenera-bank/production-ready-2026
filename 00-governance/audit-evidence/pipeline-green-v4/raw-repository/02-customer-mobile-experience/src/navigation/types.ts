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
