# 08 — Test Evidence Matrix

**HEAD:** `44efb4413583bbc7cb108892cd1f060034c2bc19`  
**CI run:** `artifacts/verification/full-ci/run1/`  
**Run metadata:** `started_at: 2026-06-30T21:22:51Z`, `gates_executed: 48`, `pipeline_fail: 1`

---

## Matriz completa

| # | Pacote | Comando | Exit | Pass | Skip | Log path |
|---|--------|---------|------|------|------|----------|
| 1 | core-bank | `npm test` | 0 | 198 | 1 | `unit/34-034-unit-test-core-bank.log` |
| 2 | core-bank | postgres IT | 0 | 14 | 0 | `integration/37-037-integration-test-postgres.log` |
| 3 | core-bank | migrations | 0 | — | — | `integration/9-009-migrations.log` |
| 4 | web-bff | `npm test` | 0 | 35 | 0 | `unit/35-035-unit-test-web-bff.log` |
| 5 | web-banking | `vitest run` | 0 | 8 | 0 | `unit/36-036-unit-test-web-banking.log` |
| 6 | outbox-relay | `npm run test:redis` | 0 | 5 | 0 | `queue/38-038-queue-test-redis.log` |
| 7 | e2e-web | `playwright test` | 0 | 4 | 0 | `e2e/47-047-e2e-playwright.log` |
| 8 | core-bank | `npm run lint` | 0 | — | — | `lint/28-028-lint-core-bank.log` |
| 9 | web-bff | `npm run lint` | 0 | — | — | `lint/29-029-lint-web-bff.log` |
| 10 | web-banking | `npm run lint` | 0 | — | — | `lint/30-030-lint-web-banking.log` |
| 11 | core-bank | `npm run build` | 0 | — | — | `build/41-041-build-core-bank.log` |
| 12 | web-bff | `npm run build` | 0 | — | — | `build/42-042-build-web-bff.log` |
| 13 | outbox-relay | `npm run build` | 0 | — | — | `build/43-043-build-outbox-relay.log` |
| 14 | web-banking | `npm run build` | 0 | — | — | `build/44-044-build-web-banking.log` |
| 15–60 | domains scaffold (46) | `jest` cada | — | ~2 cada | 0 | `domains/*/src/*.spec.ts` (não no full-ci gate individual) |

---

## Estágios CI

| Stage | Gates | Pass | Fail | Result |
|-------|-------|------|------|--------|
| foundation | 10 | 10 | 0 | PASS |
| backend | 6 | 6 | 0 | PASS |
| web | 9 | 9 | 0 | PASS |
| worker | 2 | 2 | 0 | PASS |
| security | 18 | 16 | 2 | **FAIL** |
| e2e | 3 | 3 | 0 | PASS |

**Fonte:** `matrix-manifest.json`

---

## Invariantes core-banking

47 invariantes T01–T47 registrados em `domains/core-bank/src/integration/invariant-registry.ts`.  
Evidência histórica: `domains/core-bank/evidence/TEST-RESULTS.txt` — Gate G3/G4 SATISFEITO.

---

## Runtime

```
node: v26.0.0
npm: 11.12.1
postgres: available (regenera_core_test)
redis: available (localhost:6379)
```

**Log:** `infra/runtime-versions.log`, `infra/postgres-check.log`, `infra/redis-check.log`

---

## Total verificável (run1)

| Categoria | Tests |
|-----------|-------|
| Unit+integration implantáveis | 260 (198+35+8+14+5) |
| E2E | 4 |
| Scaffold domains (local, não gateado) | ~92 |
| **Total aproximado** | **~356** |