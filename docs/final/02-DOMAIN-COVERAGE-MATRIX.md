# 02 — Domain Coverage Matrix

**HEAD:** `44efb4413583bbc7cb108892cd1f060034c2bc19`  
**Fonte domínios:** `domains/SCAFFOLD-MANIFEST.json` (46) + `domains/core-bank/` (separado)  
**Gerado:** 2026-06-30 UTC

## Legenda de status

| Status | Significado |
|--------|-------------|
| **ACTIVE_INTERNAL** | Implementado e testável localmente (simulator/memory/postgres test) |
| **ACTIVE_SANDBOX** | Adapter sandbox/homolog disponível |
| **EXTERNAL_ACTIVATION_REQUIRED** | Production adapter lança erro explícito |
| **REGULATORY_ACTIVATION_REQUIRED** | Produção exige licença/homologação regulatória |

---

## Core Banking (fora dos 46 scaffold)

| Requirement | Domain | Channel | Contract | Test | Evidence | Status |
|-------------|--------|---------|----------|------|----------|--------|
| Ledger append-only, partidas duplas | core-bank | BFF, worker | `regenera-bank-v1.openapi.yaml` | 198 unit + 14 postgres IT | `domains/core-bank/evidence/TEST-RESULTS.txt`, `artifacts/verification/full-ci/run1/unit/34-034-unit-test-core-bank.log` | **ACTIVE_INTERNAL** |
| Pix engine + E2E ID BACEN | core-bank/pix | web-bff | `web-banking-v1.yaml` `/banking/pix` | incl. em 198 | `domains/core-bank/src/pix/pix-engine.spec.ts` | **ACTIVE_INTERNAL** |
| Payment engine + UNKNOWN | core-bank/payments | web-bff | `web-banking-v1.yaml` | T38–T39 invariantes | `domains/core-bank/src/payments/payment-engine.spec.ts` | **ACTIVE_INTERNAL** |
| Outbox transacional | core-bank/outbox | outbox-relay | asyncapi events | 5 redis IT | `artifacts/verification/full-ci/run1/queue/38-038-queue-test-redis.log` | **ACTIVE_SANDBOX** |

---

## 46 Domínios Scaffold

| # | Requirement | Domain | Channel | Contract | Test | Evidence | Status |
|---|-------------|--------|---------|----------|------|----------|--------|
| 1 | Auth, MFA, sessão | identity | web, android | `web-banking-v1.yaml` `/auth` | 2 | `domains/identity/src/identity.spec.ts` | **ACTIVE_INTERNAL** / prod **EXTERNAL_ACTIVATION_REQUIRED** |
| 2 | Cadastro PF/PJ | customers | web-bff | parcial OpenAPI | 2 | `domains/customers/src/customers.spec.ts` | **ACTIVE_INTERNAL** |
| 3 | LGPD consentimento | consent | web | — | 2 | `domains/consent/src/consent.spec.ts` | **ACTIVE_INTERNAL** |
| 4 | Device trust | devices | web, android | — | 2 | `domains/devices/src/devices.spec.ts` | **ACTIVE_INTERNAL** |
| 5 | Push/email/SMS | notifications | web, android | — | 2 | `domains/notifications/src/notifications.spec.ts` | **ACTIVE_INTERNAL** |
| 6 | KYC documental | kyc | web-bff | `/onboarding` | 2 | `domains/kyc/src/kyc.spec.ts`, `bff/web-bff/src/onboarding/` | **ACTIVE_SANDBOX** |
| 7 | AML monitoramento | aml | ops | — | 2 | `domains/aml/src/aml.spec.ts` | **ACTIVE_INTERNAL** |
| 8 | Fraude scoring | fraud | ops | — | 2 | `domains/fraud/src/fraud.spec.ts` | **ACTIVE_INTERNAL** |
| 9 | Sanctions screening | sanctions | ops | — | 2 | `domains/sanctions/src/sanctions.spec.ts` | **ACTIVE_INTERNAL** |
| 10 | Casos investigação | case-management | windows-ops | — | 2 | `domains/case-management/src/case-management.spec.ts` | **ACTIVE_INTERNAL** |
| 11 | Contas ledger | accounts | web-bff | `/banking/accounts` | 2 | `domains/accounts/src/accounts.spec.ts` | **ACTIVE_INTERNAL** |
| 12 | Razão contábil | ledger | core-bank | delega core | 2 | `domains/ledger/src/ledger.spec.ts` | **ACTIVE_INTERNAL** |
| 13 | Extrato paginado | transactions | web | `/banking/transactions` | 2 | `domains/transactions/src/transactions.spec.ts` | **ACTIVE_SANDBOX** |
| 14 | Contabilidade | accounting | ops | — | 2 | `domains/accounting/src/accounting.spec.ts` | **ACTIVE_INTERNAL** |
| 15 | Reconciliação UNKNOWN | reconciliation | core-bank | delega core | 2 | `domains/reconciliation/src/reconciliation.spec.ts` | **ACTIVE_INTERNAL** |
| 16 | Pagamentos genéricos | payments | web-bff | `/banking/payments` | 2 | `domains/payments/src/payments.spec.ts` | **ACTIVE_INTERNAL** |
| 17 | Pix participante | pix | web-bff | `/banking/pix` | 2 | `domains/pix/src/pix.spec.ts` | **ACTIVE_SANDBOX** |
| 18 | TED/TEF | transfers | web-bff | `/banking/transfers` | 2 | `domains/transfers/src/transfers.spec.ts` | **ACTIVE_SANDBOX** |
| 19 | Cartões emissão | cards | web | parcial | 2 | `domains/cards/src/cards.spec.ts` | **ACTIVE_INTERNAL** / UI mock |
| 20 | Autorização cartão | card-authorization | ops | — | 2 | `domains/card-authorization/src/card-authorization.spec.ts` | **ACTIVE_INTERNAL** |
| 21 | Faturas cartão | card-invoices | web | — | 2 | `domains/card-invoices/src/card-invoices.spec.ts` | **ACTIVE_INTERNAL** |
| 22 | Disputas chargeback | disputes | ops | — | 2 | `domains/disputes/src/disputes.spec.ts` | **ACTIVE_INTERNAL** |
| 23 | Crédito | credit | web | — | 2 | `domains/credit/src/credit.spec.ts` | **ACTIVE_INTERNAL** |
| 24 | Limites transacionais | limits | web-bff | — | 2 | `domains/limits/src/limits.spec.ts` | **ACTIVE_INTERNAL** |
| 25 | Tarifas | fees | core | — | 2 | `domains/fees/src/fees.spec.ts` | **ACTIVE_INTERNAL** |
| 26 | Cobrança | collections | ops | — | 2 | `domains/collections/src/collections.spec.ts` | **ACTIVE_INTERNAL** |
| 27 | Investimentos | investments | web | — | 2 | `domains/investments/src/investments.spec.ts` | **ACTIVE_INTERNAL** / UI mock |
| 28 | Suitability | suitability | web | — | 2 | `domains/suitability/src/suitability.spec.ts` | **ACTIVE_INTERNAL** |
| 29 | Ordens bolsa | orders | web | — | 2 | `domains/orders/src/orders.spec.ts` | **ACTIVE_INTERNAL** |
| 30 | Custódia | custody | web | — | 2 | `domains/custody/src/custody.spec.ts` | **ACTIVE_INTERNAL** |
| 31 | Criptoativos | crypto | web | — | 2 | `domains/crypto/src/crypto.spec.ts` | **ACTIVE_INTERNAL** / prod **REGULATORY_ACTIVATION_REQUIRED** |
| 32 | Proteção/seguros | protection | web | — | 2 | `domains/protection/src/protection.spec.ts` | **ACTIVE_INTERNAL** |
| 33 | Seguros parceiros | insurance | web | — | 2 | `domains/insurance/src/insurance.spec.ts` | **ACTIVE_INTERNAL** |
| 34 | Marketplace | marketplace | web | — | 2 | `domains/marketplace/src/marketplace.spec.ts` | **ACTIVE_INTERNAL** / UI mock |
| 35 | Benefícios/descontos | benefits | web | — | 2 | `domains/benefits/src/benefits.spec.ts` | **ACTIVE_INTERNAL** |
| 36 | Rewards | rewards | web | — | 2 | `domains/rewards/src/rewards.spec.ts` | **ACTIVE_INTERNAL** |
| 37 | Sonhos/vault | dreams | web | — | 2 | `domains/dreams/src/dreams.spec.ts` | **ACTIVE_INTERNAL** |
| 38 | Kids banking | kids | web | — | 2 | `domains/kids/src/kids.spec.ts` | **ACTIVE_INTERNAL** |
| 39 | Senior banking | senior | web | — | 2 | `domains/senior/src/senior.spec.ts` | **ACTIVE_INTERNAL** |
| 40 | Pet savings | pets | web | — | 2 | `domains/pets/src/pets.spec.ts` | **ACTIVE_INTERNAL** |
| 41 | Viagens | travel | web | — | 2 | `domains/travel/src/travel.spec.ts` | **ACTIVE_INTERNAL** |
| 42 | Eventos | events | web | — | 2 | `domains/events/src/events.spec.ts` | **ACTIVE_INTERNAL** |
| 43 | Sustentabilidade | sustainability | web | — | 2 | `domains/sustainability/src/sustainability.spec.ts` | **ACTIVE_INTERNAL** |
| 44 | Educação financeira | academy | web | — | 2 | `domains/academy/src/academy.spec.ts` | **ACTIVE_INTERNAL** |
| 45 | Analytics/insights | analytics | web | — | 2 | `domains/analytics/src/analytics.spec.ts` | **ACTIVE_INTERNAL** |
| 46 | SPI + DICT BACEN | integrations-spi | pix rail | — | 2 | `domains/integrations-spi/src/integrations-spi.spec.ts` | **ACTIVE_INTERNAL** / prod **EXTERNAL_ACTIVATION_REQUIRED** |

---

## Totais de teste (evidência CI run1)

| Escopo | Pass | Skip | Log |
|--------|------|------|-----|
| core-bank unit+integration | 198 | 1 | `unit/34-034-unit-test-core-bank.log` |
| Postgres IT | 14 | 0 | `integration/37-037-integration-test-postgres.log` |
| Scaffold 46 × ~2 | ~92 | 0 | `domains/*/src/*.spec.ts` |
| web-bff | 35 | 0 | `unit/35-035-unit-test-web-bff.log` |
| web-banking | 8 | 0 | `unit/36-036-unit-test-web-banking.log` |
| e2e Playwright | 4 | 0 | `e2e/47-047-e2e-playwright.log` |
| outbox-relay redis | 5 | 0 | `queue/38-038-queue-test-redis.log` |

**Scaffold gerado em:** `domains/SCAFFOLD-MANIFEST.json` → `generatedAt: 2026-06-30T21:17:21.150Z`, `filesCreated: 602`.