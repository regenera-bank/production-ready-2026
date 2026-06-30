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
 * REGENERA BANK · ENTERPRISE v4.0
 * Module: useBalanceStore
 *
 * Purpose:
 * Store reativo de saldo com atualização via WebSocket.
 *
 * Developer Signature:
 * Author : Paulo Ricardo de Leão <RG-2098233287>
 *
 * License: UNLICENSED
 */

import { create } from 'zustand';

interface BalanceState {
  balanceCents: number;
  lastUpdated: Date | null;
  setBalance: (cents: number) => void;
  addToBalance: (cents: number) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  balanceCents: 0,
  lastUpdated: null,
  setBalance: (cents) =>
    set({ balanceCents: cents, lastUpdated: new Date() }),
  addToBalance: (cents) =>
    set((state) => ({
      balanceCents: state.balanceCents + cents,
      lastUpdated: new Date(),
    })),
}));