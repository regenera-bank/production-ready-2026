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

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useStore } from '../store/useStore';

import { Platform } from 'react-native';

// In DEV, use localhost for iOS Simulator and 10.0.2.2 for Android Emulator.
const DEV_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
export const API_BASE = __DEV__ ? DEV_URL : (process.env.EXPO_PUBLIC_API_URL || 'https://regenera-core-api-520859662036.southamerica-east1.run.app');

/**
 * Enterprise Axios Instance
 * Configurado com interceptors para injeção de Token e tratamento global de erros.
 */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '4.0.0-Mobile',
  },
});

// Interceptor: Injeção de Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Tratamento de Erros Global
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = (error.response?.data as any)?.message || 'Erro de conexão com o servidor neural';
    
    if (error.response?.status === 401) {
      useStore.getState().logout();
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

// --- DTOs & Types ---

export interface NeuralInsightResponse {
  insight?: string;
  summary?: string;
  confidence?: number;
}

export interface OpenFinanceAccount {
  id: string;
  name: string;
  number: string;
  balance?: number;
  currency?: string;
}

export interface OpenFinanceTransaction {
  id: string;
  date: string;
  detail?: string;
  description?: string;
  amount: number;
  currency: string;
  debit?: number;
  credit?: number;
}

// --- API Modules ---

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/v1/auth/login', { email, password }),
    
  register: (name: string, email: string, password: string) =>
    api.post('/v1/auth/register', { name, email, password }),
};

export const openFinanceApi = {
  connect: (provider: string, username: string, password: string) =>
    api.post('/v1/open-finance/connect', { provider, username, password }).then(res => res.data),
    
  providers: () =>
    api.get('/v1/open-finance/providers').then(res => res.data),
    
  accounts: (key: string) =>
    api.get<{ accounts: OpenFinanceAccount[] }>(`/v1/open-finance/accounts?key=${encodeURIComponent(key)}`).then(res => res.data),
    
  transactions: (key: string, accountId: string, currency = 'USD') =>
    api.get<{ transactions: OpenFinanceTransaction[] }>(
      `/v1/open-finance/transactions?key=${encodeURIComponent(key)}&account=${accountId}&currency=${currency}&date_start=01/01/2025&date_end=31/12/2025`
    ).then(res => res.data),
  
  disconnect: (key: string) =>
    api.delete(`/v1/open-finance/disconnect?key=${encodeURIComponent(key)}`).then(res => res.data),
};

export const neuralApi = {
  chat: (message: string, userId = 'user-2098233287') =>
    api.post('/v1/neural-core/chat', { message, userId }),
    
  insight: () =>
    api.get<NeuralInsightResponse>('/v1/neural-core/insight'),
    
  analyze: (type: string, data: object) =>
    api.post('/v1/neural-core/analyze', { type, data }),
};
