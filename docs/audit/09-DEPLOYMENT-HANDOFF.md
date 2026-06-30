# 09 — Deployment Handoff

**Deploy executado nesta fase:** NÃO  
**Baseline:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank`  
**Commit:** N/A (sem git no baseline canônico)

## Componentes implantáveis

| Componente | Path | Build |
|------------|------|-------|
| Core-bank domain | `domains/core-bank` | PASS (`nest build`) |
| Web BFF | `bff/web-bff` | PASS (`nest build`) |
| Canal web | `apps/web-banking` | PASS (`tsc && vite build`) |

## Ordem de implantação sugerida (não executada)

1. Postgres / Neon — migrations `domains/core-bank/db/migrations/V001*.sql`
2. Redis (se partners API idempotency) — `REDIS_URL`
3. Core-bank service (quando adapter Postgres existir)
4. BFF `bff/web-bff` — Cloud Run ou container Node
5. Web `apps/web-banking` — Firebase Hosting ou Vercel (após fix build)
6. Secrets via GCP Secret Manager — `scripts/pull-secrets.mjs`

## Variáveis necessárias (nomes apenas)

### BFF (`bff/web-bff/.env.example`)

- `DATABASE_URL`
- `JWT_SESSION_SECRET`
- `PROMETEO_API_KEY`
- `GEMINI_API_KEY` / `GEMINI_GCP_PROJECT_ID`
- `GOOGLE_VISION_API_KEY` ou `VISION_USE_ADC`
- `FIREBASE_*` (project, credentials)
- `KYC_PROVIDER` (`homolog` | `firebase` | `prometeo`)
- `HOMOLOG_STORE_PATH`
- `HOMOLOG_EXPOSE_PASSWORD_RESET_TOKEN` (false em produção)

### Web (`apps/web-banking`)

- `VITE_API_URL`
- `VITE_FIREBASE_*`

## Health checks

- `GET /health` → `{ status: "ok" }`
- `GET /health/integrations` → `ready: true` quando integrações configuradas

## Smoke tests pós-deploy

```bash
curl -s http://BFF_HOST/health
curl -s http://BFF_HOST/health/integrations
# POST /auth/register + /auth/session + /auth/password-reset/request
```

## Rollback

- BFF: redeploy imagem anterior Cloud Run
- Web: rollback Firebase Hosting release
- DB: migrations append-only — rollback via partidas compensatórias, não DELETE ledger

## Bloqueadores explícitos

1. Rotacionar secrets expostos em `.env` backups antes de qualquer push
2. Corrigir build web-banking
3. Inicializar git ou espelhar para repo com histórico
4. Decidir adapter Postgres para core-bank (atualmente in-memory)

## Credenciais a rotacionar (nomes)

`PROMETEO_API_KEY`, `JWT_SESSION_SECRET`, `GEMINI_API_KEY`, `GOOGLE_VISION_API_KEY`, `DATABASE_URL` password, Firebase service account