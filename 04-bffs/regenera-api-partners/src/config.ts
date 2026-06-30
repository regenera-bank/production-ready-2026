import { z } from 'zod';

const Schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  PORT: z.coerce.number().int().positive().default(8443),
  HOST: z.string().default('0.0.0.0'),
  TLS_CERT_PATH: z.string().min(1),
  TLS_KEY_PATH: z.string().min(1),
  TLS_CA_PATH: z.string().min(1),
  OIDC_ISSUER: z.string().url(),
  OIDC_AUDIENCE: z.string().min(3),
  JWKS_URL: z.string().url(),
  CORE_API_BASE_URL: z.string().url(),
  CORE_CLIENT_CERT_PATH: z.string().min(1),
  CORE_CLIENT_KEY_PATH: z.string().min(1),
  CORE_CA_PATH: z.string().min(1),
  REDIS_URL: z.string().url(),
  DOCS_ENABLED: z.coerce.boolean().default(false)
}).superRefine((value, context) => {
  if (value.NODE_ENV !== 'production') return;

  for (const [name, url] of [
    ['OIDC_ISSUER', value.OIDC_ISSUER],
    ['JWKS_URL', value.JWKS_URL],
    ['CORE_API_BASE_URL', value.CORE_API_BASE_URL]
  ] as const) {
    if (!url.startsWith('https://')) {
      context.addIssue({ code: 'custom', path: [name], message: 'TLS obrigatório em produção' });
    }
  }

  if (!value.REDIS_URL.startsWith('rediss://')) {
    context.addIssue({ code: 'custom', path: ['REDIS_URL'], message: 'TLS obrigatório em produção' });
  }
});

export const config = Schema.parse(process.env);
