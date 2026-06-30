# 17 — Riscos Residuais (Auditoria Independente Agent 8)

**Agente:** A08 (adversarial auditor)  
**Timestamp UTC:** 2026-06-30T20:45:00Z  
**Baseline:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank`  
**Método:** Inspeção direta de código + reexecução independente de gates (sem confiar em relatórios anteriores)

---

## Resumo

| Severidade | Quantidade | Bloqueia validação de deploy? |
|------------|------------|-------------------------------|
| Crítico | 2 | Sim (até mitigação) |
| Alto | 4 | Condicional |
| Médio | 5 | Não |
| Baixo | 3 | Não |

---

## R-01 — Git baseline desatualizado vs working tree (CRÍTICO)

| Campo | Valor |
|-------|-------|
| **Commit HEAD** | `76237ded082352a8904e2d78b51174340c80b6c2` |
| **Delta** | 23 modificados + ~50 não rastreados (Postgres adapter, BullMQ, guards KYC, web fixes) |
| **Evidência** | `git show HEAD:domains/core-bank/src/core-bank.module.ts` → apenas in-memory; `workers/outbox-relay/` ausente no HEAD |

**Impacto:** Evidência de testes desta auditoria reflete a **working tree**, não o commit de preservação. `git checkout HEAD` **não** reproduz o estado auditado.

**Mitigação obrigatória antes de deploy produtivo:**
```bash
git add -A && git commit -m "chore: baseline pós-gates — postgres, bullmq, auth/kyc, web"
```

---

## R-02 — PII em `bff/web-bff/.data/homolog-store.json` (CRÍTICO)

| Campo | Valor |
|-------|-------|
| **Arquivo** | `bff/web-bff/.data/homolog-store.json` |
| **Conteúdo** | E-mails, telefones e chaves Pix de homologação real |
| **Git** | Ignorado (`.data/` em `.gitignore`) — **não** no índice |
| **Gitleaks** | 4 achados `generic-api-key` em scan de `bff/web-bff` (exit 1) |

**Impacto:** Dado local de dev; **não** deve entrar em artefato de handoff nem imagem de container.

**Mitigação:** Excluir `.data/` do zip de handoff; nunca montar em produção; rotacionar dados de teste se vazamento.

---

## R-03 — Documentação 09/10 contradiz estado atual (ALTO)

| Doc | Afirmação obsoleta | Estado real (2026-06-30) |
|-----|-------------------|--------------------------|
| `09-DEPLOYMENT-HANDOFF.md` | Commit N/A, sem git | Git init feito (`11-GIT-BASELINE.md`) |
| `09-DEPLOYMENT-HANDOFF.md` | Adapter Postgres pendente | `CORE_BANK_STORAGE` default `postgres`; 14 IT PASS |
| `09-DEPLOYMENT-HANDOFF.md` | Corrigir build web | `npm run build` exit 0 |
| `10-FINAL-INDEPENDENT-AUDIT.md` | G9 BullMQ ausente | `workers/outbox-relay/` + 5 testes Redis PASS |
| `10-FINAL-INDEPENDENT-AUDIT.md` | `.env` ativo permanece | `.env` removidos; quarentena em `.local-credentials/` |
| `10-FINAL-INDEPENDENT-AUDIT.md` | Decisão GO condicionado | Supersedido por `19-INDEPENDENT-FINAL-AUDIT.md` |

**Mitigação:** Usar `18-DEPLOYMENT-HANDOFF-FINAL.md` como fonte canônica de deploy.

---

## R-04 — Secrets legados em árvore Git rastreada (ALTO)

| Campo | Valor |
|-------|-------|
| **Scan** | `gitleaks detect` em `git archive HEAD` (full tree) |
| **Resultado** | 7 achados em paths de governança/legado (`00-governance/`, SAST redacted) |
| **Deployable only** | 1 achado — falso positivo `idempotencyKey` em `pix-engine.spec.ts` |

**Impacto:** Histórico de governança contém amostras redigidas; risco de falsa confiança em scans automatizados.

**Mitigação:** Rotacionar secrets listados em §8 de `18-DEPLOYMENT-HANDOFF-FINAL.md`; purgar legado em ciclo posterior.

---

## R-05 — Rotação de credenciais pré-push (ALTO)

Secrets foram movidos para `/Volumes/PRINCIPAL/Grok/.local-credentials/regenera-bank/` (ver `11-GIT-BASELINE.md`). **Não** há evidência de rotação pós-quarentena nesta sessão.

**Mitigação:** Rotacionar todos os nomes em lista de rotação antes de qualquer remote/push.

---

## R-06 — Worker outbox sem Dockerfile/CI dedicado (ALTO)

| Campo | Valor |
|-------|-------|
| **Path** | `workers/outbox-relay/` |
| **Gap** | Sem Dockerfile nem entrada em pipeline de deploy verificada |

**Impacto:** Código e testes existem; empacotamento Cloud Run/K8s não auditado nesta fase.

**Mitigação:** Adicionar container + health na ordem de deploy (ver doc 18).

---

## R-07 — npm audit com vulnerabilidades (MÉDIO)

| Pacote | Critical | High |
|--------|----------|------|
| `apps/web-banking` | 1 (vitest, dev) | 1 |
| `bff/web-bff` | 0 | 6 |
| `domains/core-bank` | 0 | 6 |

**Mitigação:** `npm audit fix` em ciclo pré-prod; priorizar deps de runtime.

---

## R-08 — Jest `--forceExit` em integrações (MÉDIO)

Postgres IT e BullMQ Redis deixam handles abertos; suites exigem `--forceExit`.

**Mitigação:** `worker.close()` / `pool.end()` em `afterAll` (melhoria, não bloqueador).

---

## R-09 — `dist/` web pode embutir Firebase config se build com `.env` (MÉDIO)

Build atual exit 0; `dist/` ignorado no Git. Se build ocorrer com `VITE_FIREBASE_*` preenchidos, chaves entram no bundle.

**Mitigação:** Build CI apenas com placeholders; secrets via runtime config ou Secret Manager no pipeline.

---

## R-10 — Homolog Pix HMAC default (MÉDIO)

`core-bank.module.ts` usa `DEFAULT_PIX_HMAC_SECRET = 'homolog-pix-hmac-secret'` se `PIX_HMAC_SECRET` ausente.

**Mitigação:** Obrigar `PIX_HMAC_SECRET` em produção via startup guard ou Secret Manager.

---

## R-11 — Cards/Wealth UI sem BFF (BAIXO)

Componentes de cartão e wealth usam estado local/display — documentado em `15-WEB-REALITY-CHECK.md`.

---

## R-12 — Chunk web > 500 kB (BAIXO)

Vite warning de bundle size — performance, não integridade financeira.

---

## R-13 — Artefatos pós-commit fora do baseline (BAIXO)

`artifacts/verification/git/head.txt`, logs Agent 8, etc. não commitados.

---

## Matriz de risco × gate

| Gate | Risco residual principal |
|------|--------------------------|
| Postgres | R-01 (baseline git) |
| BullMQ | R-01, R-06 (container) |
| Secrets | R-02, R-04, R-05 |
| Git | R-01 |
| Migrations | Nenhum bloqueador (14/14 PASS) |
| Web | R-09, R-11 |
| KYC prod | Guard implementado — risco baixo se `NODE_ENV=production` + `KYC_PROVIDER=prometeo` |

---

## Referências de evidência (esta sessão)

| Log | Path |
|-----|------|
| Core unit | `artifacts/verification/agent8-audit/core-bank-unit.log` |
| Core Postgres | `artifacts/verification/agent8-audit/core-bank-postgres.log` |
| BullMQ Redis | `artifacts/verification/agent8-audit/outbox-relay-redis.log` |
| BFF auth/KYC | `artifacts/verification/agent8-audit/bff-auth-kyc.log` |
| Web build | `artifacts/verification/agent8-audit/web-build.log` |
| Secret scan | `artifacts/verification/agent8-audit/secret-scan.log` |
| Gitleaks tracked deployable | `artifacts/verification/agent8-audit/gitleaks-deployable-tracked.log` |