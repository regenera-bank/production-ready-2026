> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

# 18 — Deployment Handoff Final

**Agente:** A08 (adversarial auditor)
**Timestamp UTC:** 2026-06-30T20:45:00Z
**Deploy executado nesta fase:** **NÃO**
**Baseline:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank`
**Artefato:** `REGENERA-PRE-DEPLOY-FINAL.zip` (+ `.sha256`)
**Fonte canônica:** Este documento **substitui** `09-DEPLOYMENT-HANDOFF.md` para handoff de validação.

---

## 1. Componentes implantáveis

| Componente | Path | Build (evidência Agent 8) | Runtime |
|------------|------|---------------------------|---------|
| Core-bank | `domains/core-bank` | PASS `nest build` | NestJS / Node 20+ |
| Outbox relay | `workers/outbox-relay` | PASS `tsc` (via test dep graph) | Node worker + Redis |
| Web BFF | `bff/web-bff` | PASS `nest build` (pretest rebuild core) | NestJS / Cloud Run |
| Canal web | `apps/web-banking` | PASS `tsc && vite build` | Static (Firebase/Vercel) |

---

## 2. Ordem de implantação (não executada)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Secret Manager — materializar secrets (sem valores aqui) │
│ 2. Postgres/Neon — migrations V001 + V002                   │
│ 3. Redis — TLS se rediss://                                  │
│ 4. Core-bank service (CORE_BANK_STORAGE=postgres)           │
│ 5. Outbox relay worker (BullMQ)                             │
│ 6. Web BFF (KYC_PROVIDER=prometeo em production)            │
│ 7. Web static (build sem .env com chaves reais)             │
│ 8. Smoke + observability gates                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Postgres / migrations

```bash
# Pré-requisito: DATABASE_URL apontando para instância vazia ou schema dedicado
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/regenera_core"
export CORE_BANK_STORAGE=postgres

cd domains/core-bank
npm run test:postgres   # validação — 14 testes (Agent 8: PASS)
# Em produção: aplicar migrations via migration-runner ou job init container
```

**Migrations (append-only):**
- `domains/core-bank/db/migrations/V001__core_banking_foundation.sql`
- `domains/core-bank/db/migrations/V002__operational_views.sql`

**Rollback DB:** Sem DELETE em ledger — usar partidas compensatórias. Reverter migration = procedimento manual documentado em runbook de DR.

### 2.2 Redis + Outbox relay

```bash
export REDIS_URL="rediss://USER:PASSWORD@HOST:6379"   # ou redis:// em dev
cd workers/outbox-relay
npm run build
npm run test:redis   # Agent 8: 5/5 PASS (Redis local)
node dist/main.js
```

**Filas:** `core-bank.outbox.v1`, DLQ `core-bank.outbox.v1.dlq`
**Graceful shutdown:** SIGTERM (implementado em `main.ts`)

### 2.3 Core-bank

```bash
export DATABASE_URL="postgresql://..."
export CORE_BANK_STORAGE=postgres
export PIX_HMAC_SECRET="<from-secret-manager>"
cd domains/core-bank && npm run build && npm run start
```

Default em código: `CORE_BANK_STORAGE` → `postgres` (`storage.config.ts`). Ausência de `DATABASE_URL` → **throw** (sem fallback in-memory).

### 2.4 Web BFF

```bash
export NODE_ENV=production
export KYC_PROVIDER=prometeo          # homolog/firebase BLOQUEADOS
export DATABASE_URL="postgresql://..."
export JWT_SESSION_SECRET="<from-secret-manager>"
# Firebase, Gemini, Vision, Prometeo — ver .env.example
cd bff/web-bff && npm run pull-secrets && npm run build && npm run start
```

**Guard:** `assertProductionKycSafe()` em `main.ts` — recusa startup se KYC homolog em production.

### 2.5 Web banking

```bash
# Build CI — placeholders apenas
export VITE_API_URL="https://bff.example.com"
# VITE_FIREBASE_* vazios ou injetados no pipeline sem commitar
cd apps/web-banking && npm run build
# Deploy dist/ para Firebase Hosting / CDN
```

---

## 3. Variáveis de ambiente (placeholders — sem valores)

### 3.1 Core-bank

| Variável | Obrigatória prod | Descrição |
|----------|------------------|-----------|
| `DATABASE_URL` | Sim | Postgres/Neon connection string |
| `CORE_BANK_STORAGE` | Sim (= `postgres`) | Modo de persistência |
| `PIX_HMAC_SECRET` | Sim | HMAC Pix — **não** usar default homolog |

### 3.2 Outbox relay

| Variável | Obrigatória prod | Descrição |
|----------|------------------|-----------|
| `REDIS_URL` | Sim | `redis://` ou `rediss://` |
| `OUTBOX_QUEUE_NAME` | Não | Default `core-bank.outbox.v1` |
| `PORT` | Não | Health HTTP (default worker config) |

### 3.3 Web BFF (`bff/web-bff/.env.example`)

| Variável | Obrigatória prod | Secret Manager |
|----------|------------------|----------------|
| `DATABASE_URL` | Sim | `regenera-database-url` |
| `JWT_SESSION_SECRET` | Sim | `regenera-jwt-session-secret` |
| `KYC_PROVIDER` | Sim (= `prometeo`) | — |
| `PROMETEO_API_KEY` | Sim | `regenera-prometeo-api-key` |
| `DATAVALID_API_KEY` | Sim (KYC real) | `regenera-datavalid-api-key` |
| `PEP_API_KEY` | Sim | `regenera-pep-api-key` |
| `GOOGLE_VISION_API_KEY` | Sim* | `regenera-vision-api-key` |
| `GEMINI_GCP_PROJECT_ID` | Sim (Vertex) | ADC / workload identity |
| `GEMINI_API_KEY` | Fallback | `regenera-gemini-api-key` |
| `FIREBASE_*` | Sim | `regenera-firebase-*` |
| `PROMETEO_WEBHOOK_VERIFY_TOKEN` | Se webhooks | `regenera-prometeo-webhook-token` |
| `TELEGRAM_BOT_TOKEN` | Opcional | `regenera-telegram-bot-token` |
| `ALLOW_HOMOLOG_KYC` | **Não** em prod | Deve estar ausente/false |
| `HOMOLOG_EXPOSE_PASSWORD_RESET_TOKEN` | **false** | — |

\* Ou `VISION_USE_ADC=true` com service account.

### 3.4 Web (`apps/web-banking/.env.example`)

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL do BFF |
| `VITE_FIREBASE_API_KEY` | Injetar no pipeline — nunca commitar |
| `VITE_FIREBASE_AUTH_DOMAIN` | Idem |
| `VITE_FIREBASE_PROJECT_ID` | Idem |
| `VITE_FIREBASE_*` | Demais campos Firebase |

---

## 4. GCP Secret Manager

```bash
cd bff/web-bff
npm run pull-secrets:list    # lista nomes canônicos
npm run pull-secrets         # materializa .env local (dev apenas)
```

**Bootstrap (primeira vez):**
```bash
npm run bootstrap-secrets    # cria secrets vazios no GCP (requer gcloud auth)
```

**Montagem Cloud Run:** usar `--set-secrets` ou volume + `load-env` — **não** bake `.env` na imagem.

---

## 5. Containers (referência — não buildados nesta fase)

| Serviço | Base sugerida | Porta | Health |
|---------|---------------|-------|--------|
| core-bank | `node:20-alpine` | 3000 | Nest health module |
| outbox-relay | `node:20-alpine` | 8080 | `GET /health` |
| web-bff | `node:20-alpine` | 3200 | `GET /health`, `GET /health/integrations` |
| web-banking | `nginx:alpine` | 80 | `GET /index.html` |

**Nota:** Dockerfiles dedicados para `outbox-relay` ainda não auditados (R-06).

---

## 6. Health checks

| Endpoint | Serviço | Resposta esperada |
|----------|---------|-------------------|
| `GET /health` | BFF | `{ "status": "ok" }` |
| `GET /health/integrations` | BFF | `ready: true`, `productionReady: true`, `kycProvider: "prometeo"` |
| `GET /health` | Outbox relay | Redis ping + worker status |

---

## 7. Smoke tests pós-deploy (não executados)

```bash
BFF_HOST="https://bff.example.com"

# Liveness
curl -sf "$BFF_HOST/health" | jq -e '.status == "ok"'

# Integrations — productionReady deve ser true
curl -sf "$BFF_HOST/health/integrations" | jq -e '.productionReady == true'

# Auth flow (homolog/staging com credenciais de teste)
curl -sf -X POST "$BFF_HOST/v1/auth/register" -H 'Content-Type: application/json' -d '{...}'
curl -sf -X POST "$BFF_HOST/v1/auth/session" -H 'Content-Type: application/json' -d '{...}'

# Core manifest (se exposto)
# persistence deve ser "postgres"

# Outbox worker
curl -sf "http://outbox-relay:8080/health" | jq -e '.redis == "ok"'
```

---

## 8. Observability

| Sinal | Onde | Formato |
|-------|------|---------|
| Logs BFF | Cloud Logging | JSON estruturado |
| Logs outbox | stdout | JSON + `correlationId` |
| Métricas core | Prometheus (design) | `DESIGN-CORE-BANKING-001.md` |
| Traces | OpenTelemetry (futuro) | Não auditado |

**Alertas mínimos sugeridos:**
- BFF `productionReady=false` em prod
- Outbox DLQ depth > 0 sustentado
- Postgres connection pool exhaustion
- Redis indisponível

---

## 9. Critérios de abort (rollback imediato)

| Condição | Ação |
|----------|------|
| `KYC_PROVIDER=homolog` em production | Abort — guard deve impedir; se bypass, kill revision |
| Ledger imbalance detectado | Freeze pagamentos; investigar |
| Outbox DLQ crescendo | Pause worker; replay manual |
| Health `ready=false` > 5 min | Rollback BFF/worker |
| Secret scan falha no artefato deployado | Abort pipeline |

### Rollback por componente

| Componente | Procedimento |
|------------|--------------|
| BFF | Cloud Run → revision anterior |
| Web | Firebase Hosting rollback release |
| Outbox worker | Scale 0 + redeploy anterior |
| Core-bank | Cloud Run revision anterior |
| DB | **Sem** rollback destrutivo — compensating entries |

---

## 10. Lista de rotação de secrets (nomes)

Rotacionar **antes** de primeiro push remoto ou exposição pública:

1. `JWT_SESSION_SECRET`
2. `JWT_NEURAL_SECRET` (se usado)
3. `DATABASE_URL` password
4. `PROMETEO_API_KEY`
5. `DATAVALID_API_KEY`
6. `PEP_API_KEY`
7. `GOOGLE_VISION_API_KEY`
8. `GEMINI_API_KEY` / `GEMINI_API_KEY_FALLBACK`
9. `FIREBASE_API_KEY` + service account JSON
10. `PROMETEO_WEBHOOK_VERIFY_TOKEN`
11. `TELEGRAM_BOT_TOKEN`
12. `PIX_HMAC_SECRET`
13. `VITE_FIREBASE_*` (se alguma vez commitada)
14. Credenciais em backups quarentenados (`.local-credentials/regenera-bank/`)

---

## 11. Artefato ZIP

| Item | Valor |
|------|-------|
| Nome | `REGENERA-PRE-DEPLOY-FINAL.zip` |
| Exclusões | `.git`, `node_modules`, `dist`, `coverage`, `.env`, `credentials`, `.DS_Store`, `__MACOSX`, `._*` |
| Inclusão | `.env.example` apenas |
| Exclusão adicional (Agent 8) | `.data/` (PII homolog — ver R-02) — **aplicada** no zip final |
| SHA-256 | `c86d5a182336f4578943e6266c7da9972e190c0d0e35a20a1fba2796e2f34fa4` |

---

## 12. Contradições resolvidas vs doc 09

| Doc 09 (obsoleto) | Doc 18 (atual) |
|-------------------|----------------|
| Sem git | Git init `76237de` (+ commit pós-gates pendente) |
| Postgres adapter pendente | Implementado, default postgres |
| Build web quebrado | PASS |
| BullMQ não mencionado | `workers/outbox-relay` na ordem de deploy |

---

## 13. Deploy executado

**NÃO** — este documento é handoff para **validação** de deploy, não execução.