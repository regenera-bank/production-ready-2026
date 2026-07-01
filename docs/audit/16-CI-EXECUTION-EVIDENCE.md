> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

# 16 — CI Execution Evidence

**Agente:** A07 (reproducible CI pipeline)
**Baseline:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank`
**Script:** `scripts/run-pre-deploy-gates.sh`
**Migration helper:** `domains/core-bank/scripts/run-migrations-ci.ts`
**Data:** 2026-06-30 UTC
**Git HEAD:** `76237ded082352a8904e2d78b51174340c80b6c2`
**Implantable manifest SHA-256:** `671b5bbe2021844e64b33b1cc7451224b2d78aae7cbdf2e6e3d577f802ec43d1`

---

## 1. Resumo executivo

| Run | Modo | Duração | Gates | Resultado | Blockers infra |
|-----|------|---------|-------|-----------|----------------|
| **run1** | `CI_CLEAN_DB=1` — drop/recreate `regenera_core_test` | 72s (`20:46:09` → `20:47:21`) | 46 | **FAIL** | Nenhum — Postgres e Redis disponíveis |
| **run2** | `CI_CLEAN_DB=0` — reutiliza DB/migrations (idempotência) | 87s (`20:47:35` → `20:49:02`) | 46 | **FAIL** | Nenhum — Postgres e Redis disponíveis |

**Ambiente:**
- `DATABASE_URL=postgresql://localhost:5432/regenera_core_test`
- `REDIS_URL=redis://localhost:6379`
- Node `v26.0.0` / npm `11.12.1`
- PostgreSQL 16.14 (Homebrew) / Redis PONG

**Reprodutibilidade:** Mesmo código (hash idêntico), mesma sequência de 46 gates, mesmos exit codes em run1 e run2 para gates funcionais.

---

## 2. Pass/fail por categoria de gate

| Categoria | Gate | Run1 | Run2 | Notas |
|-----------|------|------|------|-------|
| Infra | runtime-versions | PASS | PASS | |
| Infra | code-hash | PASS | PASS | 212 arquivos implantáveis |
| Infra | postgres-check | PASS | PASS | `pg_isready` + `SELECT version()` |
| Infra | redis-check | PASS | PASS | `redis-cli ping` → PONG |
| Infra | postgres-db-prep | PASS | PASS | run1: drop/recreate; run2: reuse |
| Install | core-bank / bff / worker / web | PASS | PASS | `npm install` |
| Migrations | V001 + V002 | PASS | PASS | run1: applied; run2: skipped (idempotente) |
| Secret scan | gitleaks core-bank | **FAIL** | **FAIL** | Falso positivo `pix-engine.spec.ts:183` |
| Secret scan | gitleaks bff | **FAIL** | **FAIL** | `homolog-store.json` passkey keys |
| Secret scan | gitleaks demais scopes | PASS | PASS | |
| Secret scan | secretlint (todos) | PASS | PASS | |
| Audit | npm audit core-bank | **FAIL** | **FAIL** | 21 vulns reportadas (exit 1 esperado) |
| Audit | npm audit web-bff | **FAIL** | **FAIL** | 29 vulns |
| Audit | npm audit web-banking | **FAIL** | **FAIL** | 5 vulns (1 critical dev) |
| Audit | npm audit outbox-relay | PASS | PASS | |
| SBOM | cyclonedx (4 pacotes) | PASS | PASS | JSON em `artifacts/verification/ci/run*/security/` |
| Lint | core / bff / web | PASS | PASS | `tsc --noEmit` |
| Typecheck | core / bff / web | PASS | PASS | `npx tsc --noEmit` |
| Unit tests | core-bank | PASS | PASS | 184 passed, 1 skipped |
| Unit tests | web-bff | **FAIL** | **FAIL** | `banking.service.spec.ts` stack overflow |
| Unit tests | web-banking | PASS | PASS | |
| Integration | postgres | PASS | PASS | 14/14 testes; `--forceExit` no CI |
| Queue | redis (BullMQ) | PASS | PASS | `outbox-relay.integration.spec.ts` |
| Security tests | core-bank invariants | PASS | PASS | float-guard, money, ledger |
| Security tests | bff auth/kyc/pii | PASS | PASS | production-kyc-guard, pii-redaction, auth |
| Build | core / bff / worker / web | PASS | PASS | |
| E2E | availability check | SKIP | SKIP | Playwright/Cypress não configurados |

---

## 3. Idempotência (run2 vs run1)

| Evidência | Run1 | Run2 |
|-----------|------|------|
| DB prep | `DROP DATABASE` + `CREATE DATABASE` | `reuse_existing_database` |
| Migrations V001 | `applied: true` | `skipped: true` |
| Migrations V002 | `applied: true` | `skipped: true` |
| Postgres integration | 14 passed (schema limpo) | 14 passed (schema reutilizado) |
| Código testado | hash `671b5bbe…` | hash `671b5bbe…` (idêntico) |

Logs: `artifacts/verification/ci/run1/integration/9-009-migrations.log` vs `run2/integration/9-009-migrations.log`

---

## 4. Blockers e falhas honestas

### Infraestrutura
**Nenhum blocker.** Postgres e Redis iniciaram e responderam em ambas as execuções.

### Falhas de código/segurança (bloqueiam deploy)

| Blocker | Gate | Exit | Evidência |
|---------|------|------|-----------|
| BFF unit test instável | `unit-test-web-bff` | 1 | `banking.service.spec.ts` — `RangeError: Maximum call stack size exceeded` no NestJS injector |
| Secret scan gitleaks | `secret-scan-gitleaks-domains-core-bank` | 1 | Test fixture `pix-engine.spec.ts` |
| Secret scan gitleaks | `secret-scan-gitleaks-bff-web-bff` | 1 | `.data/homolog-store.json` passkey material |
| Dependency audit | `audit-npm-*` (3 pacotes) | 1 | Vulnerabilidades npm reportadas — não mascaradas com `\|\| true` |

### Não bloqueantes / SKIP

| Item | Motivo |
|------|--------|
| E2E Playwright/Cypress | Não configurado em `apps/web-banking` — gate registra SKIP, exit 0 por política |

---

## 5. Tabela completa — Run 1 (clean DB)

| # | Comando / Gate | CWD | Exit | Log path | Timestamp (UTC) |
|---|----------------|-----|------|----------|-----------------|
| 1 | runtime-versions | repo root | 0 | `artifacts/verification/ci/run1/infra/runtime-versions.log` | 2026-06-30T20:46:09Z |
| 2 | code-hash | repo root | 0 | `artifacts/verification/ci/run1/hash/code-tested.log` | 2026-06-30T20:46:09Z |
| 3 | infra-postgres-check | repo root | 0 | `artifacts/verification/ci/run1/infra/postgres-check.log` | 2026-06-30T20:46:12Z |
| 4 | infra-redis-check | repo root | 0 | `artifacts/verification/ci/run1/infra/redis-check.log` | 2026-06-30T20:46:13Z |
| 5 | infra-postgres-db-prep (drop/recreate) | repo root | 0 | `artifacts/verification/ci/run1/infra/postgres-db-prep.log` | 2026-06-30T20:46:13Z |
| 6 | npm install | `domains/core-bank` | 0 | `artifacts/verification/ci/run1/install/5-005-install-core-bank.log` | 2026-06-30T20:46:13Z |
| 7 | npm install | `bff/web-bff` | 0 | `artifacts/verification/ci/run1/install/6-006-install-web-bff.log` | 2026-06-30T20:46:14Z |
| 8 | npm install | `workers/outbox-relay` | 0 | `artifacts/verification/ci/run1/install/7-007-install-outbox-relay.log` | 2026-06-30T20:46:16Z |
| 9 | npm install | `apps/web-banking` | 0 | `artifacts/verification/ci/run1/install/8-008-install-web-banking.log` | 2026-06-30T20:46:17Z |
| 10 | npx ts-node scripts/run-migrations-ci.ts | `domains/core-bank` | 0 | `artifacts/verification/ci/run1/integration/9-009-migrations.log` | 2026-06-30T20:46:18Z |
| 11 | gitleaks detect (core-bank) | repo root | 1 | `artifacts/verification/ci/run1/security/10-010-secret-scan-gitleaks-domains-core-bank.log` | 2026-06-30T20:46:19Z |
| 12 | @secretlint/quick-start (core-bank) | repo root | 0 | `artifacts/verification/ci/run1/security/11-011-secret-scan-secretlint-domains-core-bank.log` | 2026-06-30T20:46:20Z |
| 13 | gitleaks detect (bff) | repo root | 1 | `artifacts/verification/ci/run1/security/12-012-secret-scan-gitleaks-bff-web-bff.log` | 2026-06-30T20:46:21Z |
| 14 | @secretlint/quick-start (bff) | repo root | 0 | `artifacts/verification/ci/run1/security/13-013-secret-scan-secretlint-bff-web-bff.log` | 2026-06-30T20:46:22Z |
| 15 | gitleaks detect (web-banking) | repo root | 0 | `artifacts/verification/ci/run1/security/14-014-secret-scan-gitleaks-apps-web-banking.log` | 2026-06-30T20:46:23Z |
| 16 | @secretlint/quick-start (web-banking) | repo root | 0 | `artifacts/verification/ci/run1/security/15-015-secret-scan-secretlint-apps-web-banking.log` | 2026-06-30T20:46:24Z |
| 17 | gitleaks detect (outbox-relay) | repo root | 0 | `artifacts/verification/ci/run1/security/16-016-secret-scan-gitleaks-workers-outbox-relay.log` | 2026-06-30T20:46:24Z |
| 18 | @secretlint/quick-start (outbox-relay) | repo root | 0 | `artifacts/verification/ci/run1/security/17-017-secret-scan-secretlint-workers-outbox-relay.log` | 2026-06-30T20:46:25Z |
| 19 | gitleaks detect (scripts) | repo root | 0 | `artifacts/verification/ci/run1/security/18-018-secret-scan-gitleaks-scripts.log` | 2026-06-30T20:46:25Z |
| 20 | @secretlint/quick-start (scripts) | repo root | 0 | `artifacts/verification/ci/run1/security/19-019-secret-scan-secretlint-scripts.log` | 2026-06-30T20:46:26Z |
| 21 | npm audit --json | `domains/core-bank` | 1 | `artifacts/verification/ci/run1/security/20-020-audit-npm-core-bank.log` | 2026-06-30T20:46:27Z |
| 22 | @cyclonedx/cyclonedx-npm | `domains/core-bank` | 0 | `artifacts/verification/ci/run1/security/21-021-sbom-core-bank.log` | 2026-06-30T20:46:29Z |
| 23 | npm audit --json | `bff/web-bff` | 1 | `artifacts/verification/ci/run1/security/22-022-audit-npm-web-bff.log` | 2026-06-30T20:46:32Z |
| 24 | @cyclonedx/cyclonedx-npm | `bff/web-bff` | 0 | `artifacts/verification/ci/run1/security/23-023-sbom-web-bff.log` | 2026-06-30T20:46:34Z |
| 25 | npm audit --json | `workers/outbox-relay` | 0 | `artifacts/verification/ci/run1/security/24-024-audit-npm-outbox-relay.log` | 2026-06-30T20:46:39Z |
| 26 | @cyclonedx/cyclonedx-npm | `workers/outbox-relay` | 0 | `artifacts/verification/ci/run1/security/25-025-sbom-outbox-relay.log` | 2026-06-30T20:46:40Z |
| 27 | npm audit --json | `apps/web-banking` | 1 | `artifacts/verification/ci/run1/security/26-026-audit-npm-web-banking.log` | 2026-06-30T20:46:41Z |
| 28 | @cyclonedx/cyclonedx-npm | `apps/web-banking` | 0 | `artifacts/verification/ci/run1/security/27-027-sbom-web-banking.log` | 2026-06-30T20:46:42Z |
| 29 | npm run lint | `domains/core-bank` | 0 | `artifacts/verification/ci/run1/lint/28-028-lint-core-bank.log` | 2026-06-30T20:46:44Z |
| 30 | npm run lint | `bff/web-bff` | 0 | `artifacts/verification/ci/run1/lint/29-029-lint-web-bff.log` | 2026-06-30T20:46:44Z |
| 31 | npm run lint | `apps/web-banking` | 0 | `artifacts/verification/ci/run1/lint/30-030-lint-web-banking.log` | 2026-06-30T20:46:45Z |
| 32 | npx tsc --noEmit | `domains/core-bank` | 0 | `artifacts/verification/ci/run1/typecheck/31-031-typecheck-core-bank.log` | 2026-06-30T20:46:46Z |
| 33 | npx tsc --noEmit | `bff/web-bff` | 0 | `artifacts/verification/ci/run1/typecheck/32-032-typecheck-web-bff.log` | 2026-06-30T20:46:47Z |
| 34 | npx tsc --noEmit | `apps/web-banking` | 0 | `artifacts/verification/ci/run1/typecheck/33-033-typecheck-web-banking.log` | 2026-06-30T20:46:48Z |
| 35 | npm test | `domains/core-bank` | 0 | `artifacts/verification/ci/run1/unit/34-034-unit-test-core-bank.log` | 2026-06-30T20:46:49Z |
| 36 | npm test | `bff/web-bff` | 1 | `artifacts/verification/ci/run1/unit/35-035-unit-test-web-bff.log` | 2026-06-30T20:46:52Z |
| 37 | npm test | `apps/web-banking` | 0 | `artifacts/verification/ci/run1/unit/36-036-unit-test-web-banking.log` | 2026-06-30T20:47:00Z |
| 38 | jest postgres.integration (forceExit) | `domains/core-bank` | 0 | `artifacts/verification/ci/run1/integration/37-037-integration-test-postgres.log` | 2026-06-30T20:47:01Z |
| 39 | npm run test:redis | `workers/outbox-relay` | 0 | `artifacts/verification/ci/run1/queue/38-038-queue-test-redis.log` | 2026-06-30T20:47:02Z |
| 40 | jest security (core) | `domains/core-bank` | 0 | `artifacts/verification/ci/run1/security/39-039-security-test-core-bank.log` | 2026-06-30T20:47:09Z |
| 41 | jest security (bff) | `bff/web-bff` | 0 | `artifacts/verification/ci/run1/security/40-040-security-test-web-bff.log` | 2026-06-30T20:47:10Z |
| 42 | npm run build | `domains/core-bank` | 0 | `artifacts/verification/ci/run1/build/41-041-build-core-bank.log` | 2026-06-30T20:47:12Z |
| 43 | npm run build | `bff/web-bff` | 0 | `artifacts/verification/ci/run1/build/42-042-build-web-bff.log` | 2026-06-30T20:47:13Z |
| 44 | npm run build | `workers/outbox-relay` | 0 | `artifacts/verification/ci/run1/build/43-043-build-outbox-relay.log` | 2026-06-30T20:47:17Z |
| 45 | npm run build | `apps/web-banking` | 0 | `artifacts/verification/ci/run1/build/44-044-build-web-banking.log` | 2026-06-30T20:47:18Z |
| 46 | e2e-availability-check (SKIP) | `apps/web-banking` | 0 | `artifacts/verification/ci/run1/e2e/e2e-availability.log` | 2026-06-30T20:47:20Z |

**Manifesto machine-readable:** `artifacts/verification/ci/run1/gate-manifest.tsv` / `gate-manifest.jsonl` / `run-metadata.json`

---

## 6. Tabela completa — Run 2 (reuse DB)

Mesma sequência de 46 gates; exit codes idênticos aos de run1. Manifesto completo:

`artifacts/verification/ci/run2/gate-manifest.tsv`

Diferenças materializadas:

| Gate | Run2 timestamp | Diferença vs run1 |
|------|----------------|-------------------|
| infra-postgres-db-prep | 2026-06-30T20:47:37Z | `action=reuse_existing_database` |
| migrations | 2026-06-30T20:47:41Z | `skipped=[V001,V002]` |
| unit-test-web-bff | 2026-06-30T20:48:35Z | Mesmo FAIL (reproduzível) |

**Manifesto machine-readable:** `artifacts/verification/ci/run2/gate-manifest.tsv` / `gate-manifest.jsonl` / `run-metadata.json`

---

## 7. Como reproduzir

```bash
# Run 1 — ambiente limpo
CI_RUN_ID=1 CI_CLEAN_DB=1 \
  DATABASE_URL=postgresql://localhost:5432/regenera_core_test \
  REDIS_URL=redis://localhost:6379 \
  bash scripts/run-pre-deploy-gates.sh

# Run 2 — idempotência (reutiliza DB)
CI_RUN_ID=2 CI_CLEAN_DB=0 \
  DATABASE_URL=postgresql://localhost:5432/regenera_core_test \
  REDIS_URL=redis://localhost:6379 \
  bash scripts/run-pre-deploy-gates.sh
```

---

## 8. Conclusão

| Critério | Status |
|----------|--------|
| Pipeline reproduzível criado | ✅ `scripts/run-pre-deploy-gates.sh` |
| Evidência por comando (cwd, exit, log, timestamp) | ✅ 46 gates × 2 runs |
| Postgres + Redis | ✅ Disponíveis — sem blocker infra |
| Migrations idempotentes | ✅ run2 skip V001/V002 |
| Builds (core, bff, worker, web) | ✅ PASS ambos runs |
| Pipeline overall | ❌ FAIL — 6 gates com exit ≠ 0 por run |

**Próximos passos para verde:** corrigir `banking.service.spec.ts` (stack overflow), tratar achados gitleaks (homolog-store / test fixtures), remediar `npm audit` ou documentar exceções com ADR.