# AGENTS.md — Regenera Bank
## Comando Mestre de Orquestração

> Documento de trabalho. Não é declaração de intenção.
> Cada linha instrui um agente a produzir código que sobrevive a auditoria bancária real.
> Nada aqui é negociável sem ADR registrado.

---

## 1. CONTEXTO REAL DO PROJETO

### O que existe hoje

**Artefatos canônicos (raiz do monorepo — agentes leem daqui):**

| Artefato | Path relativo | Path absoluto |
|----------|---------------|---------------|
| Design HTML Layout 1 | `desing-final-escolhido-geral-index.html` | `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank/desing-final-escolhido-geral-index.html` |
| Mapa mestre (90 dias, ondas A–E) | `MAPA_MESTRE_DESENVOLVIMENTO_CANAIS_REGENERA_BANK(1).md` | `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank/MAPA_MESTRE_DESENVOLVIMENTO_CANAIS_REGENERA_BANK(1).md` |
| Money value object (referência) | `money.value-object.ts` | `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank/money.value-object.ts` |
| Money value object (importar) | `domains/core-bank/src/money/money.value-object.ts` | — |
| Tom de comentário | `STYLE.pt-BR.md` | `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank/STYLE.pt-BR.md` |
| Portão byte-a-byte | `regenera-agent.mjs` | `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank/regenera-agent.mjs` |

**Design (canal de referência):**
- `desing-final-escolhido-geral-index.html` — protótipo HTML (~4.251 linhas)
- Fonte: Manrope
- Paleta: `--primary-color: #22d3ee`, `--bg-deep: #020617`, `--bg-gradient-start: #1e3a8a`
- 23 módulos visuais mapeados em `view-*` (home, transactions, pix, transfer, cards, investments, crypto, credit, protection, cloud, kids, senior, pets, dreams, marketplace, rewards, discounts, events, travel, sustainability, academy, analytics, profile)
- 7 módulos com navegação real: home, transactions, pix, transfer, cards, investments, profile
- 55 funções JS — todas locais, estado em memória, sem backend real
- Assistente "Raphaela" como orb de IA (fenrir/kore/puck themes)
- Implementação React viva: `apps/web-banking/` (Layout 1 + BFF)

**Domínio financeiro (já produzido):**
- `money.value-object.ts` — Money com BigInt, TypeORM transformer, proibição de float real (raiz = referência)
- `domains/core-bank/src/money/money.value-object.ts` — **importar sempre daqui**; agentes não reescrevem
- `05-core-bank/` — 12 arquivos Kotlin auditados, commit `7336481c`, GPG RSA-4096 `730834AB4126C341A70F6B969826A3AC0BF6A90C`
- `domains/core-bank/` — NestJS: ledger, idempotency, holds, payments, pix, reconciliation, outbox, audit

**Ferramentas:**
- `regenera-agent.mjs` — agente de limpeza de comentário com portão byte-a-byte (SHA-256 antes/depois, reprova se código mudou)
- `STYLE.pt-BR.md` — contrato de tom: comentário explica porquê e risco, nunca o quê

**Mapa mestre:**
- `MAPA_MESTRE_DESENVOLVIMENTO_CANAIS_REGENERA_BANK(1).md` — 20 seções, 1.225 linhas, plano de 90 dias + ondas A–E

**Baseline auditada:**
- 17 domínios, 1.977 arquivos, 1.180 testes, GPG 17/17 válido
- PRODUCT-READY para diligência — não em produção ainda
- Bloqueios externos explícitos: HSM, IAM, ICP-Brasil, BACEN, SOC, DR

---

## 2. REGRAS ABSOLUTAS — PORTÃO REPROVA SE VIOLADO

```
REGRA 1 — FLOAT NUNCA TOCA DINHEIRO
  Money usa BigInt em centavos. Sempre. Sem exceção.
  number só entra se for Number.isSafeInteger() — e vira BigInt antes de qualquer cálculo.
  float, parseFloat, toFixed, Math.round em contexto financeiro = BLOQUEANTE.
  MoneyColumnTransformer no TypeORM: coluna BIGINT, string na serialização JSON.

REGRA 2 — LEDGER É APPEND-ONLY
  journal_entries e ledger_postings: sem UPDATE, sem DELETE.
  Trigger de banco enforce isso. Não é sugestão.
  Correção = nova partida compensatória com reversalOf apontando para o original.

REGRA 3 — IDEMPOTÊNCIA VINCULADA AO HASH DO PAYLOAD
  payloadHash = SHA-256(JSON.stringify(payload, Object.keys(payload).sort()))
  Mesma chave + payload diferente = ConflictException — nunca sobrescrever.
  Estado UNKNOWN bloqueia execução. Não é retry. É reconciliação.

REGRA 4 — UNKNOWN É SAGRADO
  Timeout externo → UNKNOWN. Nunca FAILED por ausência de resposta.
  UNKNOWN bloqueia retry automático.
  Saída = reconciliação com evidência externa.

REGRA 5 — PARTIDAS DUPLAS SEMPRE BALANCEADAS
  D = C em cada lançamento. Trigger no banco verifica ao postar (DRAFT→POSTED).
  Lançamento desbalanceado nunca chega a POSTED.

REGRA 6 — COMENTÁRIO NO TOM DA CASA
  Segue STYLE.pt-BR.md: porquê e risco, nunca o quê.
  regenera-agent.mjs valida: código byte a byte antes e depois.
  Vestígio de IA (ENTERPRISE SYSTEM, God-Tier, v4.0, emoji, "As an AI") = BLOQUEANTE.

REGRA 7 — CANAL NÃO É DOMÍNIO
  Web/Android/iOS criam intenção. Não calculam saldo, não postam ledger.
  BFF compõe resposta. Não decide fraude, não acessa tabela interna.
  Core Banking decide e registra. Ninguém mais.

REGRA 8 — DESIGN SYSTEM ANTES DE TELA
  Todo componente novo nasce do token. Não reinventa cor nem fonte.
  Paleta: cyan #22d3ee, navy #020617, blue #1e3a8a. Fonte: Manrope.
  Estado visual no protótipo = referência, não fonte de verdade.

REGRA 9 — FATO EXTERNO NÃO É SIMULADO
  HSM, certificado, parecer, homologação BACEN, SOC: registrados como BLOQUEIO.
  Nunca declarar ativo sem evidência no pacote.

REGRA 10 — SEGREGAÇÃO MAKER-CHECKER
  Quem cria não aprova. Quem executa não revisa.
  Operações privilegiadas exigem segunda identidade.
```

---

## 3. MONEY — CONTRATO DEFINITIVO (NestJS/TypeScript)

O `money.value-object.ts` já existe e está correto. Os agentes não o reescrevem.
Eles o importam. Qualquer módulo financeiro que não use este arquivo é BLOQUEANTE.

```typescript
// porta de entrada única para dinheiro.
// float morreu aqui. não passa.
import { Money, MoneyColumnTransformer, CurrencyCode } from './money.value-object';

// em entidade TypeORM:
@Column({ type: 'bigint', transformer: MoneyColumnTransformer })
amount: Money;

// em serialização JSON:
// Money.toJSON() → { amountCents: string, currency: CurrencyCode }
// nunca number. JSON number é float por especificação.

// em operação financeira:
const fee = principal.percentageBps(150n);     // 1,5% em basis points — determinístico
const [part1, part2] = total.allocate(2);       // rateio sem criar nem destruir centavo
```

---

## 4. MÓDULOS A PRODUZIR (NestJS — stack real)

### 4.1 Core Banking (`domains/core-bank/`)

```
src/
  money/
    money.value-object.ts          ← JÁ EXISTE — importar, não reescrever
    money.value-object.spec.ts
  errors/
    core-banking.errors.ts         ← ValidationException, ConflictException,
                                      NotFoundException, StateTransitionException
  accounts/
    account.entity.ts              ← LedgerAccount, AccountClass, AccountStatus
    account-registry.service.ts    ← open, block, close, requireOpen
    account.spec.ts
  ledger/
    ledger.entity.ts               ← JournalEntry, Posting, PostingSide
    ledger.service.ts              ← post, reverse, signedBalance, verifyHash
    ledger.spec.ts                 ← 12 invariantes mínimas (ver seção 6)
  idempotency/
    idempotency.entity.ts          ← IdempotencyRecord, IdempotencyState (UNKNOWN)
    idempotency.service.ts         ← begin, complete, markUnknown, failRetryable
    idempotency.spec.ts
  holds/
    hold.entity.ts
    hold-book.service.ts           ← place, consume, release, expire, availableBalance
    hold-book.spec.ts
  payments/
    payment.entity.ts              ← Payment, PaymentStatus, CreatePaymentCommand
    payment-engine.service.ts      ← create, markSent, markSettled, markUnknown,
                                      openReconciliation, reconcile
    payment-engine.spec.ts         ← 15 invariantes + concorrência
  pix/
    pix.entity.ts                  ← endToEndId formato BACEN: E{ISPB}{yyyyMMddHHmm}{11 alphanum}
    pix-engine.service.ts          ← create, HMAC da chave, masking do recebedor
    pix-engine.spec.ts
  outbox/
    outbox.entity.ts               ← OutboxEvent, publishedAt null na criação
    outbox.service.ts              ← append, pending, markPublished (idempotente)
    outbox.spec.ts
  audit/
    audit-chain.entity.ts          ← AuditEvent, hash encadeado SHA-256
    audit-chain.service.ts         ← append, verify (tamper detection)
    audit-chain.spec.ts
  reconciliation/
    reconciliation.entity.ts
    reconciliation.service.ts      ← open (só de UNKNOWN), resolve (SETTLED|REJECTED)
    reconciliation.spec.ts
  core-bank.module.ts
  core-bank.service.ts
db/
  migrations/
    V001__core_banking_foundation.sql   ← schema, tipos ENUM, tabelas, 4 triggers
    V002__operational_views.sql         ← account_signed_balances, available_balances,
                                          unresolved_financial_states
docs/
  adr/
    ADR-001-LEDGER-APPEND-ONLY.md
    ADR-002-IDEMPOTENCIA-HASH-PAYLOAD.md
    ADR-003-ESTADO-UNKNOWN.md
    ADR-004-ENQUADRAMENTO-BACEN.md
  runbooks/
    RUNBOOK-CORE-001-UNKNOWN.md
    RUNBOOK-CORE-002-LEDGER-IMBALANCE.md
    RUNBOOK-CORE-003-DR-RESTORE.md
  EXTERNAL-BLOCKERS.md
governance/
  CONTROL-MATRIX.csv
  OWNERS.json
  REGULATORY-TRACEABILITY.csv
evidence/
  TEST-RESULTS.txt
  VALIDATION-REPORT.json
  SBOM.cdx.json
  PACKAGE-CHECKSUMS.sha256
```

### 4.2 Canais (ordem por prioridade — do MAPA_MESTRE)

```
P0 — Onda A (Foundation Banking):
  apps/web-banking/          ← React/TypeScript, Manrope, paleta cyan/navy
  bff/web-bff/               ← NestJS BFF, compõe resposta, não acessa ledger
  domains/identity/          ← login, MFA, device trust
  domains/accounts/          ← LedgerAccount via Core Banking
  domains/statements/        ← extrato paginado, comprovantes
  contracts/openapi/         ← Account, Balance, Statement, Error catalog

P0 — Onda B (Payments):
  domains/payments/          ← PaymentEngine (já no core-bank)
  domains/pix/               ← PixEngine + DICT + SPI
  apps/android/              ← Kotlin + Jetpack Compose
  apps/ios/                  ← Swift + SwiftUI

P1 — Onda C (Cards):
  domains/cards/
  apps/windows-operations/   ← .NET/WinUI, RBAC, four-eyes

P2+ — Ondas D e E:
  domains/credit/, investments/, kids/, senior/, dreams/, rewards/, sustainability/
```

### 4.3 Design System (`design-system/`)

```
tokens/
  color.json         ← primary: #22d3ee, bg-deep: #020617, navy: #1e3a8a
  typography.json    ← Manrope 400/500/600/700/800
  spacing.json
  radius.json
  elevation.json
  motion.json        ← --transition-curve: cubic-bezier(0.4, 0, 0.2, 1)
web/
  components/        ← Storybook, 23 componentes obrigatórios (ver seção 7)
android/             ← Jetpack Compose catalog
ios/                 ← SwiftUI catalog
```

---

## 5. DAG DE 16 PRs — CORE BANKING

```
PR-00   docs + ADRs (ledger append-only, idempotência, UNKNOWN, BACEN)
PR-00b  CI NestJS verde — prerequisito de todos os outros
          ↓
PR-01   money.value-object.spec.ts — testa o arquivo que já existe
PR-02   errors.ts — hierarquia de exceções tipadas
PR-03   accounts.ts — AccountRegistry, lifecycle
PR-04a  DB migrations V001 — schema, ENUMs, tabelas, 4 triggers
PR-04b  DB migrations V002 — views operacionais
PR-05   audit-chain.ts — hash encadeado SHA-256
PR-06   outbox.ts — OutboxEvent, relay transacional
PR-07   idempotency.ts — IdempotencyRegistry, hash payload, UNKNOWN
PR-08   holds.ts — HoldBook, availableBalance, expiry
PR-09   ledger.ts — Ledger service, partidas duplas, hash por lançamento
PR-10   payments.ts — PaymentEngine, máquina de estados, outbox + audit atômicos
PR-11   pix.ts — PixEngine, E2E ID BACEN, HMAC, masking
PR-12   reconciliation.ts — ReconciliationCase, UNKNOWN → SETTLED|REJECTED
PR-13   core-bank.module.ts — composição NestJS
PR-14   integration tests — 47 invariantes (todos os PRs acima)
          ↓
PR-15   load test 50k/dia + canário
```

**Gates obrigatórios:**
- PR-00b: CI verde antes de qualquer PR de feature
- PR-09: ledger.spec.ts com 12 invariantes antes de PR-10
- PR-14: 47 testes, 0 falhando, antes de PR-15

---

## 6. INVARIANTES DE TESTE OBRIGATÓRIAS

O reviewer reprova qualquer PR de domínio financeiro sem estes testes:

```typescript
// ── MONEY ──
'float é recusado na entrada'
'overflow de BigInt é detectado'
'moedas diferentes não somam'
'percentageBps é determinístico (half-away-from-zero)'
'allocate não cria nem destrói centavo'

// ── LEDGER ──
'débitos ≠ créditos → ValidationException antes de POSTED'
'moedas misturadas → ValidationException'
'linha com valor zero → ValidationException'
'mesmo idempotencyKey + payload igual → retorna original'
'mesmo idempotencyKey + payload diferente → ConflictException'
'verifyEntryHash permanece estável após persistência'
'reverse cria partidas espelhadas — não edita original'
'segunda reversão → ConflictException'
'reversão de reversão → StateTransitionException'

// ── IDEMPOTENCY ──
'COMPLETED → Replay com responseReference'
'UNKNOWN → Blocked (não executa, não tenta)'
'FAILED_RETRYABLE → Acquired (pode retentar)'
'payload diferente na mesma chave → ConflictException'

// ── HOLDS ──
'hold reduz saldo disponível'
'hold acima do disponível → ConflictException'
'hold expirado para de reservar'
'hold liberado restaura disponível'

// ── PAYMENTS ──
'16 threads simultâneas com mesma chave → 1 efeito financeiro'
'fundos insuficientes → ConflictException'
'UNKNOWN bloqueia retry automático → StateTransitionException'
'reconciliação SETTLED mantém saldo debitado'
'reconciliação REJECTED cria partida compensatória → saldo restaurado'
'falha no create deixa idempotência em FAILED_FINAL, não PROCESSING'
'conta ASSET como clearing → ValidationException'

// ── AUDIT CHAIN ──
'adulteração de payload detectada por verify()'

// ── OUTBOX ──
'markPublished é idempotente'
'pending(0) → ValidationException'
```

---

## 7. COMPONENTES DE DESIGN OBRIGATÓRIOS

Mapeados do protótipo HTML para o Design System real:

```
Autenticação:
  LoginCard           ← screen-login, biometria (face/finger), scanline
  IntroScreen         ← intro-card, sunburst, barras de loading

Navegação:
  BottomNav           ← nav-btn-home/transactions/cards/profile + side-menu
  SideMenu            ← side-menu-panel, menu folders, módulos aninhados
  HeaderBar           ← header-back-btn, header-title

Home:
  HeroCard            ← hero-card, saldo mascarável, expansão com chevron
  BalanceDisplay      ← hero-balance-text, top-eye-icon (toggle mask)
  ActionGrid          ← botões rápidos (Pix, transferência, pagamento)

Transações:
  TransactionRow      ← ícone, descrição, valor (+ verde, - vermelho), data
  StatementList       ← renderTxLists, paginação, filtros

Pix:
  PixSendPanel        ← pix-panel-send, pix-key-address, pix-input-amount
  PixReceivePanel     ← pix-panel-receive, QR, copia e cola
  PixKeysList         ← pix-panel-keys

Transferência:
  TransferForm        ← transfer-bank, transfer-branch, transfer-account,
                        transfer-beneficiary, transfer-amount

Cartões:
  CardSelector        ← cc-blue, cc-black, cc-silver (tabs)
  CardDisplay         ← cartão 3D, número mascarado, limite
  LimitSlider         ← limit-range-slider

Assistente:
  RaphaelOrb          ← main-raphaela-orb, temas fenrir/kore/puck,
                        sacred geometry, status bubble
  VoiceChatSheet      ← ai-chat-sheet, chat-messages-area, visual-voice-waves

Estados obrigatórios (cada tela):
  loading, empty, error, offline, timeout, processing,
  settled, unknown, reversed, blocked, step-up-required
```

---

## 8. FLUXO DOS AGENTES

### Fase 1 — Design Doc

```
[writer]
  Recebe: AGENTS.md + design HTML + MAPA_MESTRE + money.value-object.ts
  Produz: DESIGN-{DOMÍNIO}-001.md com:
    - arquitetura de módulos NestJS
    - diagrama de fluxo financeiro
    - PR Plan (DAG da seção 5 ou equivalente)
    - Open Questions com defaults
    - decisões-chave com referência a ADR
    - EXTERNAL-BLOCKERS.md honesto

[reviewer]
  Checklist BLOQUEANTE:
    □ float em contexto financeiro
    □ UPDATE/DELETE no ledger
    □ retry de UNKNOWN sem reconciliação
    □ saldo calculado fora do razão
    □ idempotência sem hash do payload
    □ fato externo declarado ativo sem evidência
    □ módulo de canal acessando ledger diretamente
  Checklist CRÍTICO:
    □ falta enquadramento BACEN com número de Res.
    □ maker-checker ausente em operação privilegiada
    □ audit event sem previousHash
    □ componente de Design System sem token
    □ EXTERNAL-BLOCKERS ausente ou incompleto

[ciclo] writer corrige → reviewer re-revisa → até 0 issues bloqueantes
```

### Fase 2 — Execução por PR

```
Para cada PR do DAG:
  [implementer] implementa em worktree git isolada
  [reviewer]    valida contra checklist (seção 8.1)
  [implementer] corrige issues
  [reviewer]    re-review
  → loop até "0 issues open"
  → merge + próximo PR

Gate de release (antes de qualquer tag):
  node regenera-agent.mjs src/ --engine heuristic   # limpa sinal de IA
  node regenera-agent.mjs src/ --engine lmstudio --apply  # com LLM local
  npm test -- --coverage                             # 0 falhando
  grep -rn "float\|parseFloat\|toFixed" src/ | grep -i "amount\|balance\|money"
  # → 0 resultados ou BLOQUEANTE
  sha256sum dist/**/*.js > PACKAGE-CHECKSUMS.sha256
  npm run sbom:generate
```

### 8.1 Checklist do reviewer por PR

```
BLOQUEANTE:
  □ float/number em valor monetário sem BigInt
  □ UPDATE ou DELETE em journal_entries ou ledger_postings
  □ retry automático sem verificar UNKNOWN
  □ saldo calculado fora do razão (via projeção de postings)
  □ idempotência sem comparar SHA-256 do payload
  □ fato externo declarado ativo sem evidência
  □ canal (web/mobile) acessando banco ou ledger diretamente
  □ sinal de IA no comentário (QUANTUM, Enterprise, God-Tier, emoji)

CRÍTICO:
  □ enquadramento BACEN sem número de Res.
  □ maker-checker ausente em operação privilegiada
  □ estado de transição sem máquina explícita
  □ audit event sem previousHash
  □ outbox com publishedAt inicial não-null
  □ Design System component sem CSS var do token
  □ runbook ausente para failure mode documentado
```

---

## 9. EXTERNAL-BLOCKERS.md — TEMPLATE OBRIGATÓRIO

Todo domínio produz este arquivo. Status honesto. Nunca fingir resolvido.

```markdown
# Bloqueios Externos — {Domínio}

| Item                      | Provider                 | Status       | Nota                                   |
|---------------------------|--------------------------|--------------|----------------------------------------|
| HSM / KMS                 | AWS CloudHSM + KMS       | PENDENTE     | Credenciais institucionais             |
| IAM institucional         | AWS IAM + GKE Workload   | PENDENTE     | Conta corporativa necessária           |
| Certificado ICP-Brasil A3 | AC Serasa / Válid        | PENDENTE     | PJ + token físico                      |
| Homologação SPI/DICT      | BACEN                    | PENDENTE     | Participação direta exige licença IP   |
| Licença IP Res. 80/2021   | BACEN                    | PENDENTE     | Processo + patrimônio mínimo           |
| Licença SCD Res. 4.656    | BACEN                    | PENDENTE     | Processo adicional para crédito        |
| Parecer jurídico          | Advogado especializado   | PENDENTE     | Interpretação de Res. BACEN            |
| SOC / SIEM                | Datadog Security         | PENDENTE     | Contrato + integração                  |
| DR exercitado             | Ambiente de DR           | PENDENTE     | RTO medido, relatório assinado         |
| Banco correspondente      | Parceiro bancário        | PENDENTE     | Conta de liquidação + acordos          |
| Pentest externo           | Empresa especializada    | PENDENTE     | Relatório + mitigação                  |
| Revisão independente      | Auditor externo          | PENDENTE     | Quem fez não aprova                    |

Essa distinção é parte do produto.
Baseline comprova: implementado + verificado localmente.
Produção exige os itens acima.
```

---

## 10. REGULATORY-TRACEABILITY.csv

```csv
obligation_id,regulation,resolution,article,domain,status,evidence,notes
REG-001,IP Modalidade Pagamento,Res. BACEN 80/2021,Art. 6,Core Banking,PENDENTE_LICENCA,,SPI exige autorização
REG-002,Sigilo bancário,LC 105/2001,Art. 1,Core Banking + Security,IMPLEMENTADO,POL-CORE-003.md,
REG-003,SCD,Res. BACEN 4.656/2018,Art. 2,Core Banking,PENDENTE_LICENCA,,Crédito direto exige autorização
REG-004,Pix Participante Direto,Manual Pix BACEN,Cap. 2,Pix + ISO 20022,PENDENTE_HOMOLOGACAO,,ISPB + DICT + SPI
REG-005,LGPD,Lei 13.709/2018,Art. 7,Data Platform + Core Banking,IMPLEMENTADO_PARCIAL,,PIA pendente
REG-006,PCI-DSS v4.0,PCI SSC,Req. 3,Core Banking + Security,PENDENTE,,Tokenização de cartão
REG-007,AML,Res. BACEN 4.753/2019,Art. 2,Risk Control,IMPLEMENTADO,docs/risk/AML-POLICY.md,
REG-008,Cybersecurity,Res. BACEN 4.658/2018,Art. 4,Security + Platform,IMPLEMENTADO_PARCIAL,,POCSEG pendente
```

---

## 11. COMO INICIAR NO CLAUDE CODE

```bash
# Passo 1 — Design do Core Banking
/design Core Banking NestJS completo conforme AGENTS.md:
  - importar money.value-object.ts existente (não reescrever)
  - arquitetura dos 13 módulos (seção 4.1)
  - DAG de 16 PRs (seção 5)
  - EXTERNAL-BLOCKERS.md honesto (seção 9)
  - enquadramento BACEN: IP Res. 80/2021, SCD Res. 4.656/2018, SPI
  Revisar até 0 issues bloqueantes.

# Passo 2 — Execução
/execute-plan completo do design doc DESIGN-CORE-BANKING-001.md:
  - 16 PRs em ordem de dependência
  - cada PR: implementer → reviewer → fix → re-review → 0 issues
  - gate final: regenera-agent.mjs + 47 testes + PACKAGE-CHECKSUMS.sha256

# Passo 3 — Limpeza de comentários (após cada PR)
node regenera-agent.mjs domains/core-bank/src/ --engine lmstudio --apply
# ou offline:
node regenera-agent.mjs domains/core-bank/src/ --engine heuristic --apply

# Passo 4 — Design do canal Web Banking
/design Web Banking React conforme AGENTS.md:
  - Design System: Manrope, paleta cyan/navy (seção 4.3)
  - 23 módulos do protótipo mapeados para domínios reais (seção 4.2)
  - 23 componentes obrigatórios (seção 7)
  - BFF separado, canal não acessa ledger
  Revisar até 0 issues bloqueantes.
```

---

## 12. CRITÉRIO DE PRODUÇÃO REAL

A primeira fase está completa quando, em ambiente de homologação:

```
Cliente autenticado em Web, Android e iOS
→ consulta conta real de homologação
→ visualiza saldo derivado do ledger (projeção de postings)
→ consulta extrato paginado
→ operação aparece no Windows Operations
→ todos os eventos têm correlation ID
→ API e canais passam em contract tests
→ logs e métricas permitem rastrear a jornada
→ nenhuma informação financeira é simulada no frontend
→ regenera-agent.mjs reporta 0 vestígios de IA no código
→ PACKAGE-CHECKSUMS.sha256 assinado com chave GPG institucional
```

Esse é o momento em que o Regenera Bank deixa de ser protótipo visual
e passa a existir como plataforma bancária.

---

## 13. ESTADO ATUAL VERIFICADO — CANAL WEB (2026-06-29)

> Delta honesto entre o critério da seção 12 e o que está no disco hoje.
> Agentes devem partir daqui — não do protótipo HTML nem do path `6bd5c`.

### Onda A — `apps/web-banking/` + `bff/web-bff/`

| Item | Status | Evidência |
|------|--------|-----------|
| Layout 1 (AppShell, safe-area, breakpoints) | **IMPLEMENTADO** | `src/index.css` + `AppShell.tsx`, import em `src/index.tsx` |
| BFF proxy dev | **IMPLEMENTADO** | Vite `:5176` → `/api` → BFF `:3200/v1` |
| Auth register + session | **REAL** | `bff-client.ts` → `bff/web-bff` |
| Dashboard + extrato | **REAL** | `fetchDashboard`, `fetchTransactions` |
| Pix + TED | **REAL** | `PixArea`, `TransferArea` → core-bank |
| 7 módulos com nav real | **PARCIAL** | home, transactions, pix, transfer, cards, investments, profile — UI ok, vários com mock |
| 23 módulos visuais | **PARCIAL** | telas existem; maioria sem domínio BFF |
| Saldo não simulado no frontend | **PARCIAL** | saldo vem do BFF; cards/crypto/lifestyle ainda mock |
| `tailwindcss-animate` | **ADICIONADO** | `package.json` — requer `npm install` |
| Scripts de migração `6bd5c` | **REMOVIDO** | monorepo autocontido |
| `regenera-agent.mjs` no canal | **PENDENTE** | rodar antes de tag de release |
| Health check BFF no login | **IMPLEMENTADO** | `LoginScreen` + `checkBffHealth()` |
| `dev:full` (BFF + Vite) | **IMPLEMENTADO** | `apps/web-banking/scripts/dev-full.mjs` |

### Comandos de dev (canal)

```bash
# Um bloco — raiz do monorepo (BFF + web + build)
cd "/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank" && npm run dev:canal-web
# → http://localhost:5176 — mantenha o terminal aberto até Ctrl+C
```

### Próximo trabalho alinhado a este AGENTS.md

1. `npm run lint && npm run build` em `apps/web-banking` + `bff/web-bff` (gate local)
2. Drenar crypto/lifestyle/investments mocks quando domínios BFF existirem
3. API de cartões (Onda C) — substituir `INITIAL_MOCK_CARDS`
4. `regenera-agent.mjs` em `apps/web-banking/src/` antes de merge

### Violações ativas a corrigir (não ignorar)

- Cartões: visual mock com banner honesto até API Onda C
- `MapWidget`: fallback geográfico local quando Raphaela não retorna locais
- Comentários com tom "QUANTUM/Enterprise" — passar `regenera-agent.mjs` antes de merge

---

*Don Paulo Ricardo de Leão — CTO, Regenera Bank*
*finance@regenerabank.world*
*Fingerprint: 730834AB4126C341A70F6B969826A3AC0BF6A90C*
*2026-06-29*