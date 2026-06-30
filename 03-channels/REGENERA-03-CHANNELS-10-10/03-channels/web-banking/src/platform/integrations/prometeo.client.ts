
// wretch imports kept for historical reference only (blinded per audit)
// import wretch from 'wretch';
// import QueryStringAddon from 'wretch/addons/queryString';

/**
 * DEPRECATED / BLINDADO (Security Audit 2026)
 * 
 * NUNCA mais use chave de API de terceiros (Prometeo, KYC, BaaS) diretamente no frontend.
 * Isso é vazamento crítico (bundle expõe a key para qualquer atacante).
 * 
 * Todo tráfego Open Banking / Prometeo agora DEVE passar pelo backend proxy:
 *   frontend -> api.url('/open-finance/*') -> Cloud Run (com PROMETEO_API_KEY injetada do Secret Manager via --set-secrets no deploy)
 *   O secret name é exatamente "PROMETEO_API_KEY" (ver gcloud secrets list e o comando gcloud run services update com --set-secrets=PROMETEO_API_KEY=PROMETEO_API_KEY:latest)
 * 
 * Este arquivo é mantido apenas para referência histórica. Qualquer import direto aqui é ERRO DE SEGURANÇA.
 * 
 * Se precisar de dados Prometeo: use o central `api` client chamando os endpoints /open-finance/* que o backend já implementa.
 */
// const _PROMETEO_API_URL = ... (kept commented - key exposure removed per security audit)

// Chave REMOVIDA do cliente. Qualquer fallback aqui é proibido.
export const prometeoApi = {
  // Intencionalmente quebrado para forçar o uso do proxy backend.
  // Em runtime qualquer chamada aqui deve falhar explicitamente.
  _deprecated: true,
  _reason: 'Use backend /open-finance/* proxy. See src/core/api/prometeo.ts header.',
} as any;
