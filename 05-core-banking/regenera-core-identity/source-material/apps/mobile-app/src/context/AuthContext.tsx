/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: React Native Frontend - Auth Context
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/mobile-app/src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../lib/api';

interface User {
  userId: string;
  email: string;
  name?: string; // Added for UI compatibility
  role?: string; // Added for UI compatibility
  token?: string; // Added for easy access
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (fullName: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('authToken');
        if (storedToken) {
          setToken(storedToken);
          await validateToken(storedToken);
        } else {
             // MOCK FOR DEVELOPMENT/MIGRATION PHASE
             // Remove this else block when backend is fully integrated
             setUser({
                 userId: 'u-mock-123',
                 email: 'cto@regenera.bank',
                 name: 'Don Paulo Ricardo',
                 role: 'ADMIN',
                 token: 'mock-token'
             });
        }
      } catch (e) {
        console.error("Failed to load token from storage", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const validateToken = async (current_token: string) => {
    try {
      const profile = await authApi.getProfile(current_token);
      setUser(profile);
      setToken(current_token); // Re-set to ensure state is consistent
    } catch (error) {
      console.error("Session token is invalid, logging out.", error);
      await SecureStore.deleteItemAsync('authToken');
      setToken(null);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      await SecureStore.setItemAsync('authToken', response.access_token);
      await validateToken(response.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.register(fullName, email, password);
      await login(email, password); // Log in after successful registration
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Don Paulo: Removendo token do SecureStore.
    await SecureStore.deleteItemAsync('authToken');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
