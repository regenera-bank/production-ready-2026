/**
 * REGENERA BANK
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