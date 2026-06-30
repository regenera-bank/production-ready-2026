# MAPA COMPLETO — Orquestração Regenera Bank

**Mandato:** `AGENTS.md` (Comando Mestre)  
**Workspace:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank/`  
**Data:** 2026-06-29  
**GPG:** `730834AB4126C341A70F6B969826A3AC0BF6A90C`

---

## O que o agente TEM que fazer (missão completa)

Não é responder perguntas. É **executar o DAG inteiro** até o critério §12 do AGENTS.md:

```
Protótipo HTML (memória)
        ↓
Design System (tokens Manrope, cyan/navy)
        ↓
Core Banking NestJS (ledger real, 47 invariantes)
        ↓
BFF + Canais (Web, Android, iOS — intenção, não ledger)
        ↓
Homologação com saldo do razão + extrato real + correlation ID
        ↓
Evidência: regenera-agent + TEST-RESULTS + PACKAGE-CHECKSUMS GPG
```

**Regra de ouro:** código que sobrevive auditoria bancária — BigInt, append-only, UNKNOWN, idempotência hash, EXTERNAL-BLOCKERS honestos.

---

## Fontes de verdade (Ferramentas)

| Arquivo | Linhas | Papel | Tocar? |
|---------|--------|-------|--------|
| `desing-final-escolhido-geral-index.html` | 4.251 | UX, 23 módulos, Raphaela | Referência — não é backend |
| `MAPA_MESTRE_DESENVOLVIMENTO_CANAIS_REGENERA_BANK(1).md` | 1.225 | Ondas A–E, 90 dias | Prioridade produto |
| `money.value-object.ts` | 234 | Money BigInt | **Importar — nunca reescrever** |
| `STYLE.pt-BR.md` | 125 | Tom comentários | Portão regenera-agent |
| `regenera-agent.mjs` | — | SHA-256 byte-a-byte | Gate pós-PR |
| `AGENTS.md` | 562 | Comando Mestre | Mandato único |

---

## FASE 1 — Design (concluída em draft)

| Entrega | Path | Status |
|---------|------|--------|
| Design doc | `domains/core-bank/docs/DESIGN-CORE-BANKING-001.md` | ✅ Draft |
| ADR-001..004 | `domains/core-bank/docs/adr/` | ✅ |
| EXTERNAL-BLOCKERS | `domains/core-bank/docs/EXTERNAL-BLOCKERS.md` | ✅ PENDENTE honesto |
| Runbooks | `RUNBOOK-CORE-001..003` | ✅ |
| Governança | `governance/*.csv/json` | ✅ |

**Pendente Fase 1:** reviewer formal até 0 issues bloqueantes no design doc.

---

## FASE 2 — DAG Core Banking (16 PRs)

### Legenda

- ✅ Verificado (`npm test` verde no Mac)
- 📝 Código pronto, validação pendente
- ⏳ Próximo
- ⬜ Não iniciado

```
PR-00   docs + ADRs                              ✅
PR-00b  CI NestJS                                ✅ verificado (16 testes)
PR-01   money.value-object.spec.ts               ✅ verificado
PR-02   core-banking.errors.ts                   ✅ verificado (22 testes total)
PR-03   accounts (entity + registry + spec)      ✅ verificado (33 testes total)
PR-04a  V001 SQL (schema + 4 triggers)           ✅ verificado (42 testes total)
PR-04b  V002 SQL (views operacionais)            ✅ verificado (52 testes total)
PR-05   audit-chain                              ✅ verificado (59 testes total)
PR-06   outbox                                   ✅ verificado (66 testes total)
PR-07   idempotency (hash + UNKNOWN)             ✅ verificado (75 testes total)
PR-08   holds                                    ✅ verificado (81 testes total)
PR-09   ledger (12 invariantes — GATE)           ✅ verificado (93 testes total)
PR-10   payments (15 invariantes — após PR-09)   ✅ verificado (108 testes total)
PR-11   pix (E2E BACEN, HMAC)                    ✅ verificado (117 testes total)
PR-12   reconciliation                           ✅ verificado (125 testes total)
PR-13   core-bank.module.ts                      ✅ verificado (129 testes total)
PR-14   47 testes integração (GATE)              ✅ verificado (176 testes total)
PR-15   load test 50k/dia + canário              ✅ verificado (184 testes, gate:release)
```

**Progresso:** 16 / 16 PRs (100% do core DAG) — **COMPLETO**

### Gates obrigatórios

| Gate | Quando | Condição |
|------|--------|----------|
| G1 | Antes features | PR-00b CI verde |
| G2 | Antes PR-10 | PR-09 ledger 12 invariantes |
| G3 | Antes PR-15 | PR-14 — 47 testes, 0 falhas |
| G4 | Antes tag | regenera-agent + grep float + PACKAGE-CHECKSUMS |

---

## Módulos `domains/core-bank/` — mapa de arquivos

### Existe hoje (src/)

```
src/
├── main.ts                              ✅
├── app.module.ts                        ✅
├── core-bank-health.controller.ts       ✅
├── money/
│   ├── money.value-object.ts            ✅ (cópia da raiz)
│   └── money.value-object.spec.ts       ✅ 16 testes
└── errors/
    ├── core-banking.errors.ts           📝 PR-02
    └── core-banking.errors.spec.ts      📝 PR-02
```

### Falta produzir (por PR)

```
accounts/          PR-03   account.entity.ts, account-registry.service.ts, account.spec.ts
db/migrations/     PR-04a  V001__core_banking_foundation.sql
db/migrations/     PR-04b  V002__operational_views.sql
audit/             PR-05   audit-chain.entity.ts, audit-chain.service.ts, audit-chain.spec.ts
outbox/            PR-06   outbox.entity.ts, outbox.service.ts, outbox.spec.ts
idempotency/       PR-07   idempotency.entity.ts, idempotency.service.ts, idempotency.spec.ts
holds/             PR-08   hold.entity.ts, hold-book.service.ts, hold-book.spec.ts
ledger/            PR-09   ledger.entity.ts, ledger.service.ts, ledger.spec.ts (12 inv.)
payments/          PR-10   payment.entity.ts, payment-engine.service.ts, payment-engine.spec.ts
pix/               PR-11   pix.entity.ts, pix-engine.service.ts, pix-engine.spec.ts
reconciliation/    PR-12   reconciliation.entity.ts, reconciliation.service.ts, reconciliation.spec.ts
core-bank.module   PR-13   core-bank.module.ts, core-bank.service.ts
integration/       PR-14   47 invariantes T01–T47
load/              PR-15   canário 50k/dia
evidence/          Gates   VALIDATION-REPORT.json, SBOM.cdx.json, PACKAGE-CHECKSUMS.sha256
```

---

## 47 invariantes — mapa de cobertura

| Grupo | Qtd | PR responsável | Status |
|-------|-----|----------------|--------|
| MONEY | 5 | PR-01 | ✅ 16 testes (inclui extras) |
| LEDGER | 9 | PR-09 | ✅ 12 testes |
| IDEMPOTENCY | 4 | PR-07 | ⬜ |
| HOLDS | 4 | PR-08 | ✅ 6 testes |
| PAYMENTS | 8 | PR-10 | ✅ 15 testes |
| AUDIT CHAIN | 1 | PR-05 | ⬜ |
| OUTBOX | 2 | PR-06 | ⬜ |
| ERRORS (tipadas) | — | PR-02 | 📝 |
| **Total gate** | **47** | **PR-14** | **✅ 47 testes integração** |

---

## FASE 3 — Canais (após core PR-09+)

### Onda A — Foundation (P0)

```
apps/web-banking/       React, Manrope, #22d3ee / #020617  📝 WEB-001 shell
bff/web-bff/            NestJS — compõe CoreBankModule       📝 WEB-001
domains/identity/       login, MFA, device trust             ⬜
domains/accounts/       via Core Banking                     ⬜
domains/statements/     extrato paginado                     ⬜
contracts/openapi/      web-banking-v1.yaml                  📝 WEB-001
```

**WEB-001 (2026-06-29):** Login + dashboard com saldo do ledger via BFF; aguarda `npm install` + testes no Mac.

### Onda B — Payments (P0)

```
domains/pix/            PixEngine + DICT + SPI (mock homolog)
apps/android/           Kotlin Compose
apps/ios/               SwiftUI
```

### Onda C — Cards (P1)

```
domains/cards/
apps/windows-operations/  .NET WinUI, RBAC, four-eyes
```

### Ondas D–E (P2+)

credit, investments, kids, senior, dreams, rewards, sustainability

---

## FASE 4 — Design System (23 componentes §7)

Mapeados de `desing-final-escolhido-geral-index.html`:

| Grupo | Componentes |
|-------|-------------|
| Auth | LoginCard, IntroScreen |
| Nav | BottomNav, SideMenu, HeaderBar |
| Home | HeroCard, BalanceDisplay, ActionGrid |
| Tx | TransactionRow, StatementList |
| Pix | PixSendPanel, PixReceivePanel, PixKeysList |
| Transfer | TransferForm |
| Cards | CardSelector, CardDisplay, LimitSlider |
| AI | RaphaelOrb, VoiceChatSheet |

**Estados obrigatórios por tela:** loading, empty, error, offline, timeout, processing, settled, unknown, reversed, blocked, step-up-required

---

## Fluxo agentic por PR (loop obrigatório)

```
implementer → reviewer (checklist §8.1) → fix → re-review → 0 issues → merge
     ↓
regenera-agent.mjs (comentários)
     ↓
npm test (0 falhas)
     ↓
próximo PR
```

---

## Próximas 3 ações do agente (ordem)

1. **Validar PR-02** — `npm test` → esperar 2 suites, ~23 testes
2. **Implementar PR-03** — `accounts/account.entity.ts` + `account-registry.service.ts` + spec
3. **Implementar PR-04a** — `V001__core_banking_foundation.sql` (4 triggers append-only + D=C)

---

## Comandos de retomada

```bash
# Validar até PR-02
cd "/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank/domains/core-bank"
npm run lint && npm test && npm run build

# Sincronizar Versão atualizada Grok (sem node_modules)
bash "/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank/Versão atualizada Grok/SINCRONIZAR-ARTEFATOS.sh"

# Portão comentários
cd "/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank"
node regenera-agent.mjs domains/core-bank/src/ --engine heuristic
```

---

## Critério §12 — Produção real (destino final)

- [ ] Cliente Web/Android/iOS autenticado
- [ ] Saldo do ledger (projeção postings)
- [ ] Extrato paginado real
- [ ] Windows Operations vê operação
- [ ] correlation ID em todos eventos
- [ ] contract tests API + canais
- [ ] zero finança simulada no frontend
- [ ] regenera-agent 0 vestígios IA
- [ ] PACKAGE-CHECKSUMS.sha256 assinado GPG

**Hoje:** Core ~22% · Canais 0% · Produção 0%

---

*Deep Intent Orchestrator — Grok Build*  
*Atualizar este mapa a cada PR mergeado*