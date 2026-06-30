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

import wretch from 'wretch';
import QueryStringAddon from 'wretch/addons/queryString';
import { auth } from '../firebase';  // Firebase SDK for real IdToken (Zero Trust - no custom Neural JWT for auth)

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://regenera-core-api-520859662036.southamerica-east1.run.app/v1';

/**
 * Cliente HTTP centralizado do Regenera Bank (usando Wretch).
 * 
 * Todas as chamadas de API no frontend devem passar por aqui.
 * 
 * Funcionalidades:
 * - Injeção automática do Bearer Token (Firebase IdToken - Identity Toolkit)
 * - Idempotency-Key para todas as mutações (POST/PUT/PATCH/DELETE) - gerado na View
 * - Retry silencioso em caso de 401 (tentativa de refresh)
 * - Headers de rastreamento (X-Trace-Id, X-Neural-Sync-ID)
 *
 * BACKEND SECRETS (MANIFESTE):
 * O backend Cloud Run recebe via --set-secrets (Secret Manager):
 *   PROMETEO_API_KEY, DATABASE_URL, JWT_NEURAL_SECRET, GEMINI_API_KEY,
 *   e os FIREBASE_* para o lado servidor.
 * Nomes exatos usados no gcloud run services update:
 *   --set-secrets=PROMETEO_API_KEY=PROMETEO_API_KEY:latest,...
 * Frontend NUNCA tem acesso a esses valores.
 */
export const api = wretch(API_URL)
  .addon(QueryStringAddon)
  .errorType('json')
  .middlewares([
    (next: any) => async (url: string, opts: any) => {
      // Use Firebase IdToken directly (Zero Trust). Get fresh token (refreshes if needed).
      let token = '';
      try {
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();  // Real Firebase IdToken, auto-refreshes
        }
      } catch (e) {
        console.warn('[SECURITY] Could not get Firebase IdToken');
      }

      const traceId = crypto.randomUUID();
      
      const headers: Record<string, string> = {
        ...(opts.headers as Record<string, string>),
        'X-Trace-Id': traceId,
        'X-Neural-Sync-ID': '2098233287',
        'X-Client-Version': '6.0.0',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // IMPORTANT (Audit 2026-06): Idempotency-Key MUST be generated in the View (e.g. PixPage useRef txId = crypto.randomUUID())
      // and passed explicitly via .headers({ 'Idempotency-Key': txId }) or in the POST body.
      // NEVER auto-generate here in the interceptor. Auto-gen on retry (network timeout) creates duplicate charges (Race Condition).
      // The middleware will forward whatever the caller provided. If absent for mutations, backend must enforce/reject duplicates.
      // const _isMutation = ... kept only as documentation of the previous auto-gen site.
      // Do not inject random UUID here. Respect explicit value from calling component only.

      return next(url, { ...opts, headers }).catch(async (error: any) => {
        // For 401: Try force refresh IdToken (Firebase handles invalidation)
        if (error.status === 401) {
          console.warn('[SECURITY] Firebase IdToken invalid. Force refreshing...');
          
          try {
            if (auth.currentUser) {
              const freshToken = await auth.currentUser.getIdToken(true);  // Force refresh
              
              // Retry with fresh token
              return next(url, {
                ...opts,
                headers: {
                  ...headers,
                  'Authorization': `Bearer ${freshToken}`
                }
              });
            } else {
              // No user, redirect
              window.location.href = '/login';
            }
          } catch (refreshError) {
            console.error('[SECURITY] Firebase token refresh failed. Session lost.');
            // Clear firebase session? Firebase handles persistence.
            window.location.href = '/login';
          }
        }
        throw error;
      });
    }
  ]);

/**
 * Orval custom mutator (name matches orval.config.ts).
 * View must generate Idempotency-Key (e.g. useRef(crypto.randomUUID())) and pass it explicitly.
 * Firebase IdToken injected for every call.
 */
export interface OrvalRequestConfig {
  url?: string;
  method?: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  // orval may pass more (baseURL etc), we ignore gracefully
}

export const customAxiosInstance = async <T = any>(config: OrvalRequestConfig): Promise<T> => {
  const {
    url = '',
    method = 'get',
    data,
    params,
    headers: overrideHeaders = {},
    signal,
  } = config || {};

  // Fresh Firebase IdToken (Identity Toolkit)
  let token = '';
  try {
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken(); // may refresh internally
    }
  } catch (e) {
    console.warn('[SECURITY][OrvalMutator] Could not get Firebase IdToken');
  }

  const traceId = crypto.randomUUID();
  const baseURL = (import.meta as any).env?.VITE_API_URL || 'https://regenera-core-api-520859662036.southamerica-east1.run.app/v1';

  // Build absolute URL (orval often gives relative path like /pix/transfer or /v1/...)
  let requestUrl = url;
  if (!requestUrl.startsWith('http')) {
    const cleanBase = baseURL.replace(/\/+$/, '');
    const cleanPath = requestUrl.replace(/^\/+/, '');
    requestUrl = `${cleanBase}/${cleanPath}`;
  }

  // Append query params if provided separately
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => {
        if (v !== undefined && v !== null) acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    requestUrl += (requestUrl.includes('?') ? '&' : '?') + qs;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Trace-Id': traceId,
    'X-Neural-Sync-ID': '2098233287',
    'X-Client-Version': '6.0.0',
    ...overrideHeaders, // <- here Idempotency-Key from View (Pix etc) arrives
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method: (method || 'get').toUpperCase(),
    headers,
    signal,
  };

  if (data !== undefined && !['GET', 'HEAD'].includes(fetchOptions.method as string)) {
    fetchOptions.body = JSON.stringify(data);
  }

  let res: Response;
  try {
    res = await fetch(requestUrl, fetchOptions);
  } catch (networkErr: any) {
    const err: any = new Error(networkErr?.message || 'Network error');
    err.status = 0;
    err.data = { message: 'Falha de rede / timeout. Tente novamente.' };
    throw err;
  }

  // 401: force refresh IdToken once
  if (res.status === 401) {
    try {
      if (auth.currentUser) {
        const fresh = await auth.currentUser.getIdToken(true);
        const retryHeaders = { ...headers, 'Authorization': `Bearer ${fresh}` };
        const retryRes = await fetch(requestUrl, { ...fetchOptions, headers: retryHeaders });
        if (retryRes.ok) return (retryRes.status === 204 ? ({} as T) : await retryRes.json()) as T;
        res = retryRes;
      } else {
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } catch (refreshErr) {
      window.location.href = '/login';
      throw refreshErr;
    }
  }

  if (!res.ok) {
    let errBody: any = null;
    try {
      errBody = await res.json();
    } catch {
      try { errBody = await res.text(); } catch { errBody = null; }
    }
    const err: any = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.data = errBody || { message: `Erro ${res.status}` };
    throw err;
  }

  if (res.status === 204 || res.status === 202) {
    // 202 Accepted is key for Pub/Sub saga PIX (frontend receives immediately, tx async)
    return {} as T;
  }

  return await res.json() as T;
};
