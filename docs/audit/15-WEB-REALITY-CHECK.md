# 15 — Web Banking Reality Check (Dangerous Simulation Removal)

**Agente:** A05 (web-banking channel)  
**Baseline:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank`  
**Data:** 2026-06-30  
**Escopo:** `apps/web-banking/src/` (exclui protótipo HTML)

---

## 1. Resumo executivo

| Gate | Resultado |
|------|-----------|
| Simulações financeiras perigosas removidas em Pix/Transfer | **PASS** |
| Operações via BFF com idempotency key estável | **PASS** |
| Estados pending → settled/rejected + operation ID | **PASS** |
| `npm run lint` (tsc) | **PASS** exit 0 |
| `npm run build` (tsc + vite) | **PASS** exit 0 |
| Contract tests (money + bff-client) | **PASS** 8/8 |

---

## 2. Auditoria grep — padrões perigosos

Comandos executados em `apps/web-banking/src/`:

```bash
rg -i "parseFloat|parseInt.*money|simulat|toast.*transfer|hardcoded.*balance" src/
rg "setTransactions|transactions\.push|balance\s*[-+]=" src/
rg "pix-ui-|transfer-ui-|Date\.now\(\)" src/components/Banking/
```

### Achados antes do fix

| Arquivo | Risco | Severidade |
|---------|-------|------------|
| `PixArea.tsx` | `parseFloat(amount)` em confirmação/sucesso | Alta |
| `PixArea.tsx` | `Number(amount)` + `reaisToCents(Math.round(value*100))` | Alta |
| `PixArea.tsx` | Idempotency `pix-ui-${Date.now()}` (instável em retry) | Média |
| `PixArea.tsx` | Sem `paymentId`; estados form/processing/success apenas | Média |
| `TransferArea.tsx` | `Number(raw)/100` e `Number(amount)` para operações | Alta |
| `TransferArea.tsx` | Idempotency `transfer-ui-${Date.now()}` | Média |
| `App.tsx` | `availableBalance={userProfile.balance}` (saldo errado) | Alta |
| `bff-client.ts` | `reaisToCents` via `Math.round(value * 100)` | Alta |

### Achados pós-fix (aceitos / fora de escopo)

| Arquivo | Observação | Risco residual |
|---------|------------|----------------|
| `PrometeoWidgetPanel.tsx` | `Number()` só para intent Prometeo (API externa, não ledger) | Baixo |
| `Cards.tsx` | Slider de limite local (UI; sem endpoint BFF de cartão) | Baixo — documentado |
| `WealthExtended.tsx`, `LifestyleExtended.tsx` | Projeções de metas a partir de saldo BFF | Baixo — display only |
| `App.tsx` `setTransactions` | Apenas via `fetchTransactions` BFF | Nenhum |

**Nenhum** `parseFloat` restante em caminhos Pix/Transfer. **Nenhuma** mutação local de saldo ou extrato para simular transferência.

---

## 3. Correções implementadas

### 3.1 `src/platform/money.ts` (novo)

- `parseMoneyInput` — decimal humano → cent string (BigInt, sem float)
- `parseMaskedCentsInput` — dígitos mascarados → cent string
- `formatCentsBrl` / `formatCentsCurrency` — display seguro
- `compareCents` — comparação de saldo em centavos
- `createIdempotencyKey` — `crypto.randomUUID()` com escopo `pix`/`transfer`

### 3.2 `src/platform/bff-client.ts`

- `reaisToCents` aceita **apenas string**; delega a `parseMoneyInput` ou pass-through de cent string
- Comentário explícito: `centsToReais` é display-only

### 3.3 `PixArea.tsx`

- Props: `availableBalanceCents` (string do BFF) em vez de `availableBalance` number
- Fluxo: `form` → `pending` → `settled` | `rejected`
- Exibe `paymentId` do `PixTransferResponse`
- Idempotency key gerada uma vez na abertura do modal de confirmação
- `isSubmittingRef` impede double-submit
- Removido `parseFloat` / `Number` em operações

### 3.4 `TransferArea.tsx`

- Mesmo padrão de estados e idempotency
- Input mascarado armazena centavos como string (`parseMaskedCentsInput`)
- Valida saldo via `compareCents` contra `availableBalanceCents`
- Exibe `paymentId` do `TransferResponse`

### 3.5 `App.tsx` + `types.ts`

- Persiste `availableBalanceCents` do dashboard BFF em `UserProfile`
- Corrige prop Pix: `availableBalanceCents` (antes usava `balance` ledger)

### 3.6 Contract tests (13-quality alignment)

Novos testes em `apps/web-banking` (não havia specs web antes):

- `src/platform/money.spec.ts` — 5 testes
- `src/platform/bff-client.money.spec.ts` — 3 testes

---

## 4. Comandos, exit codes e logs

| Comando | CWD | Exit | Log |
|---------|-----|------|-----|
| `npm run lint` | `apps/web-banking` | **0** | `artifacts/verification/lint/web-banking-lint.log` |
| `npm run build` | `apps/web-banking` | **0** | `artifacts/verification/build/web-banking-build.log` |
| `npm test` | `apps/web-banking` | **0** | `artifacts/verification/unit/web-banking-test.log` |

### Lint

```
$ npm run lint
> tsc --noEmit
LINT_EXIT:0
```

### Build

```
$ npm run build
> tsc --noEmit && vite build
✓ 1753 modules transformed.
✓ built in 1.30s
BUILD_EXIT:0
```

### Tests

```
$ npm test
 ✓ src/platform/money.spec.ts (5 tests)
 ✓ src/platform/bff-client.money.spec.ts (3 tests)
 Test Files  2 passed (2)
      Tests  8 passed (8)
TEST_EXIT:0
```

---

## 5. Contrato financeiro por ação

| Ação | BFF endpoint | Idempotency-Key | Operation ID | Estados UI |
|------|--------------|-----------------|--------------|------------|
| Pix enviar | `POST /banking/pix/transfers` | `pix-ui-{uuid}` | `paymentId` | pending → settled/rejected |
| Transferência interna | `POST /banking/transfers` | `transfer-ui-{uuid}` | `paymentId` | pending → settled/rejected |
| Pós-operação | `GET /banking/dashboard` + `GET /banking/transactions` | — | — | refresh via `onOperationComplete` |

---

## 6. Blockers residuais

| ID | Blocker | Prioridade |
|----|---------|------------|
| WB-01 | Exclusão de chave Pix sem endpoint BFF (`handleDeleteKey` mostra erro) | P2 |
| WB-02 | QR Code EMV Pix não integrado (receive tab) | P2 |
| WB-03 | `Cards.tsx` limite de cartão é UI local — precisa API BFF para ser operação real | P3 |
| WB-04 | `PrometeoWidgetPanel` ainda usa `Number()` para amount do widget externo | P3 |
| WB-05 | Módulos lifestyle/wealth usam `user.balance` para projeções de metas (não mutam ledger) | P4 |

---

## 7. Veredito

**PASS** — Canal web-banking não simula mais Pix/transferências localmente. Valores monetários em operações usam cent strings; BFF é a única fonte de verdade para saldo e extrato; build e testes executados com exit 0 e logs arquivados.