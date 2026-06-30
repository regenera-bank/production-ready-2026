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

import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  tier: 'Standard' | 'Plus' | 'Premium' | 'Metal' | 'Enterprise' | 'Ultra';
  account?: string;
  agency?: string;
  neuralId?: string;
  cpf?: string; // strict CPF validated via Prometeo for ghost account prevention in register
  prefs?: { voice?: string; personality?: string; theme?: string };
}

export type AppTheme = 'cyan' | 'purple' | 'emerald' | 'amber' | 'crimson';

export interface Toast {
  message: string;
  type: 'success' | 'alert' | 'security';
}

interface AppState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  theme: AppTheme;
  toast: Toast | null;
  // PRECISION: Use integer cents (BRL * 100) to avoid IEEE 754 float errors (0.1 + 0.2 !== 0.3).
  // Never store money as number. Render with (cents / 100).toFixed(2) only at the last mile (UI).
  globalBalanceCents: number;
  sidebarOpen: boolean;

  // actions
  setUser: (user: UserProfile | null) => void;
  setAuthenticated: (v: boolean) => void;
  setTheme: (t: AppTheme) => void;
  showToast: (message: string, type?: Toast['type']) => void;
  showFeedback: (message: string, type?: any) => void;
  updateBalanceCents: (centsDelta: number) => void; // pass integer cents, e.g. -12345 for -R$123.45
  logout: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  theme: 'cyan',
  toast: null,
  globalBalanceCents: 0,
  sidebarOpen: false,

  setUser: (user) => set({ user }),

  setAuthenticated: (v) => set({ isAuthenticated: v }),

  setTheme: (theme) => set({ theme }),

  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 4000);
  },

  showFeedback: (message, type = 'success') => { console.log(type);
    set({ toast: { message, type: 'success' } });
    setTimeout(() => set({ toast: null }), 4000);
  },

  updateBalanceCents: (centsDelta) => set((state) => ({ globalBalanceCents: state.globalBalanceCents + centsDelta })),

  logout: () => {
    sessionStorage.removeItem('neural_token');
    // prometeo_key is never stored in client (Secret Manager + BFF only per MANIFESTE)
    set({ user: null, isAuthenticated: false, globalBalanceCents: 0, sidebarOpen: false });
    window.location.replace('/login');
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
