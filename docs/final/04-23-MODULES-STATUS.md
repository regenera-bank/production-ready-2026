# 04 — 23 Modules Status

**HEAD:** `FINAL_COMMIT_PENDING`
**Fonte visual:** `desing-final-escolhido-geral-index.html` (`view-*` screens)
**Implementação React:** `apps/web-banking/src/App.tsx`
**Gerado:** 2026-06-30 UTC

## Legenda

| Status | Significado |
|--------|-------------|
| **ACTIVE_SANDBOX** | UI + BFF homolog com dados reais do core |
| **ACTIVE_INTERNAL** | Domínio simulator ativo; UI ainda mock |
| **UI_ONLY** | Tela visual sem backend/BFF |
| **EXTERNAL_ACTIVATION_REQUIRED** | Produção/rail externo pendente |
| **REGULATORY_ACTIVATION_REQUIRED** | Ativação regulatória (BACEN/CVM) |

---

## Matriz dos 23 módulos

| # | Módulo | View ID | Componente React | Domínio alvo | BFF endpoint | Test/Evidence | Status |
|---|--------|---------|------------------|--------------|--------------|---------------|--------|
| 1 | Home | `view-home` | `App.tsx` hero | accounts, transactions | `GET /banking/dashboard` | e2e login+dashboard implícito; `bff/web-bff/src/banking/` | **ACTIVE_SANDBOX** |
| 2 | Transações | `view-transactions` | `TransactionsModule` | transactions | `GET /banking/transactions` | `36-036-unit-test-web-banking.log` (bff-client) | **ACTIVE_SANDBOX** |
| 3 | Pix | `view-pix` | `PixArea` | pix, core-bank | `POST /banking/pix` | `e2e/pix-flow.spec.ts` 1 pass | **ACTIVE_SANDBOX** |
| 4 | Transferência | `view-transfer` | `TransferArea` | transfers | `POST /banking/transfers` | `e2e/transfer-flow.spec.ts` 1 pass | **ACTIVE_SANDBOX** |
| 5 | Cartões | `view-cards` | `CardsModule` | cards | — (mock) | `INITIAL_MOCK_CARDS` em `Cards.tsx` | **UI_ONLY** / domínio **ACTIVE_INTERNAL** |
| 6 | Investimentos | `view-investments` | `Investments` | investments | — | `domains/investments/src/investments.spec.ts` 2 pass | **UI_ONLY** |
| 7 | Cripto | `view-crypto` | `CryptoModule` | crypto | — | `domains/crypto/README.md` REGULATORY | **UI_ONLY** / **REGULATORY_ACTIVATION_REQUIRED** |
| 8 | Crédito | `view-credit` | `LoansModule` | credit | — | `domains/credit/src/credit.spec.ts` | **UI_ONLY** |
| 9 | Proteção | `view-protection` | `InsuranceModule` | protection, insurance | — | `domains/protection/src/protection.spec.ts` | **UI_ONLY** |
| 10 | Cloud | `view-cloud` | `SavingsModule` | — | — | protótipo HTML only | **UI_ONLY** |
| 11 | Kids | `view-kids` | lifestyle/kids | kids | — | `domains/kids/src/kids.spec.ts` | **UI_ONLY** |
| 12 | Senior | `view-senior` | lifestyle/senior | senior | — | `domains/senior/src/senior.spec.ts` | **UI_ONLY** |
| 13 | Pets | `view-pets` | `pet-savings` | pets | — | `domains/pets/src/pets.spec.ts` | **UI_ONLY** |
| 14 | Sonhos | `view-dreams` | `DreamVault` | dreams | — | `domains/dreams/src/dreams.spec.ts` | **UI_ONLY** |
| 15 | Marketplace | `view-marketplace` | `Marketplace` | marketplace | — | `domains/marketplace/src/marketplace.spec.ts` | **UI_ONLY** |
| 16 | Rewards | `view-rewards` | `Rewards` | rewards | — | `domains/rewards/src/rewards.spec.ts` | **UI_ONLY** |
| 17 | Descontos | `view-discounts` | benefits UI | benefits | — | `domains/benefits/src/benefits.spec.ts` | **UI_ONLY** |
| 18 | Eventos | `view-events` | events UI | events | — | `domains/events/src/events.spec.ts` | **UI_ONLY** |
| 19 | Viagens | `view-travel` | `TravelConcierge` | travel | — | `domains/travel/src/travel.spec.ts` | **UI_ONLY** |
| 20 | Sustentabilidade | `view-sustainability` | sustainability UI | sustainability | — | `domains/sustainability/src/sustainability.spec.ts` | **UI_ONLY** |
| 21 | Academy | `view-academy` | education UI | academy | — | `domains/academy/src/academy.spec.ts` | **UI_ONLY** |
| 22 | Analytics | `view-analytics` | `StatementInsights` | analytics | — | `domains/analytics/src/analytics.spec.ts` | **UI_ONLY** |
| 23 | Perfil | `view-profile` | `ProfileHub` | identity, customers | `GET /auth/session`, onboarding | `e2e/login.spec.ts` 2 pass | **ACTIVE_SANDBOX** |

---

## Resumo quantitativo

| Status | Count |
|--------|-------|
| ACTIVE_SANDBOX | 6 (home, transactions, pix, transfer, profile + parcial cards saldo) |
| UI_ONLY | 15 |
| REGULATORY_ACTIVATION_REQUIRED | 1 (crypto — produção) |
| ACTIVE_INTERNAL (domínio sem UI real) | 22 lifestyle/wealth domains |

---

## Navegação real vs protótipo

AGENTS.md §13 confirma **7 módulos com nav real**: home, transactions, pix, transfer, cards, investments, profile.
Destes, apenas **5** têm dados BFF reais (cards e investments permanecem mock).

**E2E log:** `artifacts/verification/full-ci/run1/e2e/47-047-e2e-playwright.log` — 4 passed (login×2, pix×1, transfer×1).

---

## Próximo trabalho (honesto)

1. Drenar `INITIAL_MOCK_CARDS` quando `domains/cards` + BFF Onda C existirem
2. Conectar investments → `domains/investments` sandbox adapter
3. Adotar `MoneyDisplay` / `OperationStatusBadge` do `design-system/web/` no canal
