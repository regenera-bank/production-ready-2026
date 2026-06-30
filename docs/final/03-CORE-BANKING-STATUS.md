# 03 — Core Banking Status

**HEAD:** `44efb4413583bbc7cb108892cd1f060034c2bc19`  
**Pacote:** `domains/core-bank/`  
**Status:** **ACTIVE_INTERNAL** (Postgres + memory); produção **EXTERNAL_ACTIVATION_REQUIRED**

---

## Módulos internos

| Módulo | Status | Spec | Invariantes |
|--------|--------|------|-------------|
| money | **ACTIVE_INTERNAL** | `money.value-object.spec.ts` | float recusado, BigInt |
| accounts | **ACTIVE_INTERNAL** | `account.spec.ts` | lifecycle open/block/close |
| ledger | **ACTIVE_INTERNAL** | `ledger.spec.ts` | 12 invariantes append-only |
| idempotency | **ACTIVE_INTERNAL** | `idempotency.spec.ts` | UNKNOWN bloqueia |
| holds | **ACTIVE_INTERNAL** | `hold-book.spec.ts` | saldo disponível |
| payments | **ACTIVE_INTERNAL** | `payment-engine.spec.ts` | 15+ invariantes |
| pix | **ACTIVE_INTERNAL** | `pix-engine.spec.ts` | E2E ID, HMAC |
| reconciliation | **ACTIVE_INTERNAL** | `reconciliation.spec.ts` | UNKNOWN→SETTLED/REJECTED |
| outbox | **ACTIVE_INTERNAL** | `outbox.spec.ts` | markPublished idempotente |
| audit | **ACTIVE_INTERNAL** | `audit-chain.spec.ts` | tamper detection |
| load gates | **ACTIVE_INTERNAL** | `load/*.spec.ts` | float-guard, canário |

---

## Evidência de testes

```
Test Suites: 20 passed, 20 total
Tests:       1 skipped, 198 passed, 199 total
```

**Log:** `artifacts/verification/full-ci/run1/unit/34-034-unit-test-core-bank.log`  
**Evidence pack:** `domains/core-bank/evidence/TEST-RESULTS.txt` (184 pass baseline pré-IT expandido)  
**Gate release:** 47 invariantes T01–T47 (`domains/core-bank/src/integration/invariant-registry.ts`)

---

## Postgres adapter

```
Tests: 14 passed, 14 total
```

**Log:** `artifacts/verification/full-ci/run1/integration/37-037-integration-test-postgres.log`  
**DB:** `postgresql://localhost:5432/regenera_core_test`  
**Migrations:** `artifacts/verification/full-ci/run1/integration/9-009-migrations.log` exit 0

---

## Storage modes

| Mode | Env | Status |
|------|-----|--------|
| memory | `CORE_BANK_STORAGE=memory` | **ACTIVE_INTERNAL** — CI default |
| postgres | `CORE_BANK_STORAGE=postgres` | **ACTIVE_SANDBOX** — homolog DB |

---

## Bloqueios produção

Ver `domains/core-bank/docs/EXTERNAL-BLOCKERS.md` e `governance/REGULATORY-TRACEABILITY.csv`.

| Item | Status |
|------|--------|
| HSM/KMS | **EXTERNAL_ACTIVATION_REQUIRED** |
| Homologação SPI BACEN | **REGULATORY_ACTIVATION_REQUIRED** |
| Licença IP Res. 80/2021 | **REGULATORY_ACTIVATION_REQUIRED** |
| Pentest externo | **EXTERNAL_ACTIVATION_REQUIRED** |

---

## Commits de referência

- Kotlin baseline auditado: `7336481c` (AGENTS.md §1)
- HEAD atual testado: `44efb4413583bbc7cb108892cd1f060034c2bc19`