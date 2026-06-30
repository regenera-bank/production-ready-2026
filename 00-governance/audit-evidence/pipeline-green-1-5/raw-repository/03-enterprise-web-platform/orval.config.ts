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
 * [+] ENTERPRISE CORE SYSTEM :: v4.0.0
 * @project       :: Regenera Bank
 * @config        :: Orval React Query Generation
 *
 * Backend secrets (from Secret Manager, injected via gcloud --set-secrets):
 * PROMETEO_API_KEY, DATABASE_URL, JWT_NEURAL_SECRET, GEMINI_API_KEY,
 * FIREBASE_* (for backend), etc.
 * The generated hooks will call endpoints that the backend implements using these
 * (e.g. /open-finance/* uses PROMETEO_API_KEY from SM, never client).
 *
 * After `npm run orval`, import typed hooks like useTransferPix, useGetOpenFinanceAccounts, etc.
 * All use the customAxiosInstance which injects real Firebase IdToken.
 *
 * Guia RTF alignment (MANIFESTE O QUE FALTA): Spec should include exact schemas from RTF
 * (BalanceResponse {balanceCents: integer e.g. 24783290}, PixTransferRequest {amountCents, idempotencyKey},
 * ChatResponse {text, intent, requires_human_approval}, Login with livenessPayload, 202 AsyncEventResponse,
 * Idempotency-Key header on /pix/transfer, /auth/face-enrollment contract).
 * Current: remote URL may 404; use ORVAL_SPEC_URL=file:./swagger.json when backend serves full OpenAPI.
 * Then mass-migrate raw api.url calls (Home, Pix etc.) to generated hooks.
 */
import { defineConfig } from 'orval';
export default defineConfig({
  regenera_api: {
    input: process.env.ORVAL_SPEC_URL || '../backend/openapi.guia.json', // local from Guia RTF for "rode orval" now (actions imediatas). In prod/CI use the /v1/api-docs-json served by Swagger in main.ts after deploy.
    output: {
      mode: 'tags-split',
      target: 'src/shared/api/generated',
      schemas: 'src/shared/api/model',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: 'src/shared/api/client.ts',
          name: 'customAxiosInstance',
        },
        query: {
          useQuery: true,
          useInfinite: false,
          useMutation: true,
          options: {
            staleTime: 10000, // Dados financeiros ficam velhos em 10 segundos
            retry: 2,         // Tenta 2 vezes antes de falhar
          }
        }
      },
    },
  },
});
