# 11 — Deployment Readiness

**HEAD:** `FINAL_COMMIT_PENDING`
**Decisão:** **NO-GO** para produção
**Fonte auditoria:** `docs/audit/19-INDEPENDENT-FINAL-AUDIT.md`

---

## Checklist pré-deploy

| # | Critério | Status | Evidence |
|---|----------|--------|----------|
| 1 | Git baseline limpo | **PASS** | HEAD `FINAL_COMMIT_PENDING`, `hash/code-tested.log` |
| 2 | Core-bank tests | **PASS** | 198 pass — `34-034-unit-test-core-bank.log` |
| 3 | Postgres IT | **PASS** | 14 pass — `37-037-integration-test-postgres.log` |
| 4 | BFF tests | **PASS** | 35 pass — `35-035-unit-test-web-bff.log` |
| 5 | Web build | **PASS** | `44-044-build-web-banking.log` |
| 6 | E2E jornadas críticas | **PASS** | 4 pass — `47-047-e2e-playwright.log` |
| 7 | Security gates | **PASS** | runtime audit critical=0 high=0 — `artifacts/verification/full-ci/run2/security/` |
| 8 | Secrets rotacionados | **EXTERNAL_ACTIVATION_REQUIRED** | `ROTATION_REQUIRED_BEFORE_DEPLOY` |
| 9 | HSM/KMS | **EXTERNAL_ACTIVATION_REQUIRED** | EXTERNAL-BLOCKERS |
| 10 | BACEN homologação | **REGULATORY_ACTIVATION_REQUIRED** | integrations-spi production |
| 11 | Outbox Postgres worker | **PASS** | `resolve-outbox-store.ts` — Postgres default; memory só com `CORE_BANK_STORAGE=memory` |
| 12 | PACKAGE-CHECKSUMS GPG | **EXTERNAL_ACTIVATION_REQUIRED** | evidência local, não assinado deploy |
| 13 | Deploy executado | **NÃO** | `docs/audit/18-DEPLOYMENT-HANDOFF-FINAL.md` |

---

## Pacote pré-deploy

| Artefato | Path |
|----------|------|
| ZIP | `REGENERA-PRE-DEPLOY-FINAL.zip` |
| SHA256 | `REGENERA-PRE-DEPLOY-FINAL.zip.sha256` |

---

## Ambiente homolog verificado

| Serviço | Endpoint | Status |
|---------|----------|--------|
| web-banking | `http://localhost:5176` | **ACTIVE_SANDBOX** |
| web-bff | `http://localhost:3200/v1` | **ACTIVE_SANDBOX** |
| postgres | `regenera_core_test` | **ACTIVE_SANDBOX** |
| redis | `localhost:6379` | **ACTIVE_SANDBOX** |

**Dev command:** `npm run dev:canal-web` (raiz monorepo)

---

## O que falta para GO

1. CI security 18/18 verde
2. Wire `PostgresOutboxRepository` no outbox-relay
3. Rotação efetiva de secrets
4. Homologação BACEN SPI (participante direto ou correspondente)
5. Pentest + SOC
6. Assinatura GPG institucional do pacote de release
