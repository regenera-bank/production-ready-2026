> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

# 16 — BFF Auth/KYC Production Guards

**Agente:** A06 (BFF auth/KYC production guards)
**Escopo:** `bff/web-bff`
**Baseline:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank`
**Data:** 2026-06-30
**Referência cruzada:** Agentes 7/8 (CI e consolidação em `19-*`)

---

## 1. Resumo executivo

| Item | Estado |
|------|--------|
| Guard de startup homolog em production | **IMPLEMENTADO** |
| Health `/v1/health/integrations` reflete KYC real | **IMPLEMENTADO** (`productionReady`, `kycProvider`) |
| Redação de PII em logs (CPF, base64 doc/selfie) | **IMPLEMENTADO** |
| Testes auth + password reset | **PASS** (9 casos) |
| Testes negativos guard homolog-in-production | **PASS** (6 casos) |
| Evidência de execução | `artifacts/audit/bff-auth-kyc-test.log` |

---

## 2. Guard de startup (`production-kyc-guard`)

**Arquivos:** `src/config/production-kyc-guard.ts`, `src/config/kyc-provider.ts`, invocado em `src/main.ts` após `loadLocalEnv()`.

### Regras

| Condição | Comportamento |
|----------|---------------|
| `NODE_ENV=production` + `KYC_PROVIDER=homolog` | **Recusa startup** (`process.exit(1)`) — sem override |
| `NODE_ENV=production` + `KYC_PROVIDER=firebase` | **Recusa startup** — modo KYC homolog via Firebase |
| `NODE_ENV=production` + `ALLOW_HOMOLOG_KYC=true` | **Recusa startup** — flag válida apenas fora de production |
| `NODE_ENV=production` + `KYC_PROVIDER=prometeo` | Permite startup |
| `NODE_ENV≠production` + homolog/firebase | Permite com **warn** se `ALLOW_HOMOLOG_KYC` ausente |

### Mensagem fatal (exemplo)

```
FATAL [PRODUCTION_KYC_GUARD]: KYC_PROVIDER=homolog é proibido com NODE_ENV=production (sem override). Use KYC_PROVIDER=prometeo.
```

---

## 3. Health controller

**Arquivo:** `src/health.controller.ts`

### Mudanças

- `datavalid` e `pep` **não** são mais marcados `true` por fallback homolog.
- Novo campo `productionReady: boolean` — `false` quando `kycHomolog=true`.
- Novo campo `kycProvider: string` — valor normalizado de `KYC_PROVIDER`.
- `ready` continua indicando operacionalidade no modo atual (homolog exige firebase/gemini/vision/webauthn).

### Exemplo homolog (`KYC_PROVIDER=homolog`)

```json
{
  "integrations": {
    "kycHomolog": true,
    "datavalid": false,
    "pep": false,
    "prometeo": false
  },
  "ready": true,
  "productionReady": false,
  "kycProvider": "homolog"
}
```

---

## 4. Redação de logs (PII)

**Arquivo:** `src/common/pii-redaction.ts`

| Função | Uso |
|--------|-----|
| `maskCpf()` | CPF → `***.982.***-25` |
| `maskUserId()` | userId numérico (CPF) mascarado |
| `redactSensitiveLogPayload()` | Remove `data:image/...;base64,...` e blobs longos |

**Aplicado em:**

- `src/banking/banking.service.ts` — logs de conta/crédito/saldo
- `src/integrations/risk-kyc/kyc-engine.service.ts` — erros OCR/biometria
- Já existente: `prometeo-identity.client.ts`, `kyc-engine.service.ts` (PLD/PEP) mascaram CPF parcial

**Não alterado (armazenamento em memória homolog):** `documentPhotoBase64` / selfie permanecem no `HomologStore` em dev — fora do escopo de log; produção usa Prometeo/Serpro sem persistência local de imagens.

---

## 5. Testes executados

**Comando:**

```bash
cd bff/web-bff && npm test -- --testPathPattern="auth.service|production-kyc-guard|health.controller|pii-redaction"
```

**Resultado:** 4 suites, **21 testes PASS**, exit code 0.

### Auth + password reset (`auth.service.spec.ts`)

| Caso | Resultado |
|------|-----------|
| Cadastro + login perfil completo | PASS |
| Cadastro duplicado → ConflictException | PASS |
| Credenciais vazias | PASS |
| Login sem cadastro | PASS |
| Reset — CPF inexistente (resposta neutra) | PASS |
| Reset — fluxo completo homolog | PASS |
| Reset — token inválido | PASS |
| Reset — token expirado | PASS |
| Reset — invalida sessão anterior | PASS |

### Guard negativo (`production-kyc-guard.spec.ts`)

| Caso | Resultado |
|------|-----------|
| homolog em development (permite + warn) | PASS |
| firebase em test | PASS |
| **homolog em production → throw** | PASS |
| **firebase homolog em production → throw** | PASS |
| **ALLOW_HOMOLOG_KYC em production → throw** | PASS |
| prometeo em production | PASS |

### Health + PII

- `health.controller.spec.ts` — 3 casos PASS
- `pii-redaction.spec.ts` — 3 casos PASS

**Log completo:** `artifacts/audit/bff-auth-kyc-test.log`

---

## 6. Variáveis de ambiente

Adicionado em `.env.example`:

```env
ALLOW_HOMOLOG_KYC=
KYC_PROVIDER=firebase
```

Documentação inline: homolog bloqueado em `NODE_ENV=production`; flag explícita apenas para não-prod.

---

## 7. Blockers / riscos residuais

| ID | Severidade | Descrição | Mitigação sugerida |
|----|------------|-----------|-------------------|
| BFF-KYC-01 | Médio | `HomologStore` persiste selfies/docs em `.data/homolog-store.json` em dev | Agent 4/14 — restringir `.data/` em CI e não montar volume em prod |
| BFF-KYC-02 | Baixo | Guard não valida presença de `PROMETEO_API_KEY` quando `KYC_PROVIDER=prometeo` em production | Health `productionReady` + alertas de deploy |
| BFF-KYC-03 | Baixo | `ALLOW_HOMOLOG_KYC` em dev só emite warn, não bloqueia | Aceitável para DX local; CI de deploy deve forçar `NODE_ENV=production` + `KYC_PROVIDER=prometeo` |
| BFF-KYC-04 | Médio | `banking.service.spec.ts` falha com `Maximum call stack size exceeded` (Nest DI) — **pré-existente**, não introduzido por Agent 6 | Investigar dependência circular em `BankingModule`; suites Agent 6 passam isoladas |

---

## 8. Arquivos alterados (Agent 6)

```
bff/web-bff/src/config/kyc-provider.ts                    (novo)
bff/web-bff/src/config/production-kyc-guard.ts              (novo)
bff/web-bff/src/config/production-kyc-guard.spec.ts       (novo)
bff/web-bff/src/common/pii-redaction.ts                   (novo)
bff/web-bff/src/common/pii-redaction.spec.ts               (novo)
bff/web-bff/src/health.controller.ts                      (alterado)
bff/web-bff/src/health.controller.spec.ts                 (novo)
bff/web-bff/src/main.ts                                   (alterado)
bff/web-bff/src/banking/banking.service.ts                (alterado)
bff/web-bff/src/integrations/risk-kyc/kyc-engine.service.ts (alterado)
bff/web-bff/.env.example                                  (alterado)
artifacts/audit/bff-auth-kyc-test.log                       (evidência)
docs/audit/16-BFF-AUTH-KYC-GUARD.md                       (este documento)
```

---

## 9. Handoff para Agent 7 (CI)

Incluir no pipeline:

1. `npm test` em `bff/web-bff` com suites `production-kyc-guard` e `auth.service`.
2. Smoke de deploy: variáveis `NODE_ENV=production`, `KYC_PROVIDER=homolog` → processo deve sair com código 1 antes de bind na porta.
3. Health check pós-deploy: assert `productionReady === true` apenas quando `kycProvider === 'prometeo'`.