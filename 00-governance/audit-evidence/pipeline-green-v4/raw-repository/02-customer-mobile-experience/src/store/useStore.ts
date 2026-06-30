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

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserTier = 'Plus' | 'Premium' | 'Metal' | 'Enterprise' | 'Ultra';

export interface UserProfile {
  neuralId: string;
  name: string;
  tier: UserTier;
  account: string;
  agency: string;
}

interface AppState {
  user: UserProfile | null;
  globalBalance: number;
  isAuthenticated: boolean;
  token: string | null;
  
  // Actions
  authenticate: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateBalance: (amount: number) => void;
  setInitialBalance: (amount: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      globalBalance: 0,
      isAuthenticated: false,
      token: null,

      authenticate: (token, user) => set({ 
        isAuthenticated: true, 
        token, 
        user 
      }),
      
      logout: () => set({ 
        isAuthenticated: false, 
        token: null, 
        user: null, 
        globalBalance: 0 
      }),
      
      updateBalance: (amount) => set((state) => ({ 
        globalBalance: state.globalBalance + amount 
      })),

      setInitialBalance: (amount) => set({
        globalBalance: amount
      })
    }),
    {
      name: '@regenera-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
