> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

# 14 — Security and Secrets Audit

**Agente:** A04 (security sanitization & scans)
**Baseline:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank`
**Data:** 2026-06-30
**Valores de secrets:** NÃO registrados neste documento (nomes e caminhos apenas)

---

## 1. Sanitização `.env`

### Verificação pós-Agent 1

| Área | Estado | Arquivos permitidos |
|------|--------|---------------------|
| `bff/web-bff/` | PASS | `.env.example`, `.env.secrets.local.example` |
| `apps/web-banking/` | PASS | `.env.example` |

**Ações A04:**

- Movidos para quarentena e posteriormente **removidos do tree**: `bff/web-bff/.env`, `bff/web-bff/.env.secrets.local`, `apps/web-banking/.env`
- `artifacts/quarantine/env-backups/` está **vazio** após sanitização
- Backups `.env.backup.*` já haviam sido movidos por Agent 1 (não permanecem em `bff/web-bff/`)
- Criado `apps/web-banking/.gitignore` com exclusão de `.env` e permissão explícita para `.env.example`

### `.env.example` (placeholders apenas)

| Path | Status |
|------|--------|
| `bff/web-bff/.env.example` | OK — variáveis vazias/comentadas |
| `bff/web-bff/.env.secrets.local.example` | OK — placeholders |
| `apps/web-banking/.env.example` | OK — `VITE_FIREBASE_*` vazios |

---

## 2. Secret scan

| Comando | Exit code | Log |
|---------|-----------|-----|
| `gitleaks detect --source <scope> --no-git --redact --verbose` (scopes: `bff/web-bff`, `apps/web-banking`, `domains/core-bank`, `scripts`, `artifacts/quarantine`) | **1** em scopes com achados; **0** em `scripts` e quarentena vazia | `artifacts/security/secret-scan.log` |
| `npx @secretlint/quick-start <src-dirs>` | **0** (todas as árvores de código implantável) | `artifacts/security/secret-scan.log` |
| Resumo estruturado | — | `artifacts/security/secret-scan-summary.txt` |

### Achados por nome (sem valores)

| Categoria | Nome / regra | Local (path) | Severidade |
|-----------|--------------|--------------|------------|
| Quarentena (removido) | `PROMETEO_API_KEY` | `artifacts/quarantine/env-backups/*` (histórico) | Crítico |
| Quarentena (removido) | `GEMINI_API_KEY`, `GEMINI_API_KEY_FALLBACK` | idem | Crítico |
| Quarentena (removido) | `GOOGLE_VISION_API_KEY` | idem | Crítico |
| Quarentena (removido) | `FIREBASE_API_KEY`, `VITE_FIREBASE_*` | idem | Alto |
| Quarentena (removido) | `JWT_SESSION_SECRET`, `JWT_NEURAL_SECRET` | idem | Crítico |
| Quarentena (removido) | `DATABASE_URL` | idem | Crítico |
| Quarentena (removido) | `DATAVALID_API_KEY`, `PEP_API_KEY` | idem | Alto |
| Quarentena (removido) | `TELEGRAM_BOT_TOKEN`, `PROMETEO_WEBHOOK_VERIFY_TOKEN` | idem | Alto |
| Build artifact | `VITE_FIREBASE_API_KEY` (gcp-api-key) | `apps/web-banking/dist/assets/*.js` | Alto |
| Homolog data | passkey `key` / `rawKey` (generic-api-key) | `bff/web-bff/.data/homolog-store.json` | Médio |
| Test fixture | `idempotencyKey` (provável falso positivo) | `domains/core-bank/src/pix/pix-engine.spec.ts` | Baixo |
| Legado | `DEVICE_SECRET` | `00-governance/audit-evidence/...` | Alto |
| Legado | Firebase `apiKey` em fontes arquivadas | `00-governance/audit-evidence/pipeline-green-v4/...` | Alto |
| Legado | credenciais sandbox | `05-core-banking/.../open-finance.service.ts` | Alto |

---

## 3. `npm audit`

| Pacote | Comando | Exit code | Log | Total | Critical | High | Moderate | Low |
|--------|---------|-----------|-----|-------|----------|------|----------|-----|
| `domains/core-bank` | `npm audit --json` | **1** | `artifacts/security/npm-audit-core-bank.log` | 21 | 0 | 6 | 12 | 3 |
| `bff/web-bff` | `npm audit --json` | **1** | `artifacts/security/npm-audit-web-bff.log` | 29 | 0 | 6 | 20 | 3 |
| `apps/web-banking` | `npm audit --json` | **1** | `artifacts/security/npm-audit-web-banking.log` | 5 | **1** | 1 | 3 | 0 |

**Pacotes destacados:** `@nestjs/platform-express` / `multer` (high), `@nestjs/cli` / `glob` (high), `vitest` (critical — dev only), `vite` (high — dev transitive).

> Exit code 1 é esperado quando há vulnerabilidades reportadas; scans **não** usaram `|| true`.

---

## 4. SBOM (CycloneDX)

| Pacote | Comando | Exit code | SBOM | Log |
|--------|---------|-----------|------|-----|
| `domains/core-bank` | `npx @cyclonedx/cyclonedx-npm --output-file artifacts/sbom/core-bank-bom.json` | **0** | `artifacts/sbom/core-bank-bom.json` | `artifacts/security/sbom-core-bank.log` |
| `bff/web-bff` | `npx @cyclonedx/cyclonedx-npm --output-file artifacts/sbom/web-bff-bom.json` | **0** | `artifacts/sbom/web-bff-bom.json` | `artifacts/security/sbom-web-bff.log` |
| `apps/web-banking` | `npx @cyclonedx/cyclonedx-npm --output-file artifacts/sbom/web-banking-bom.json` | **0** | `artifacts/sbom/web-banking-bom.json` | `artifacts/security/sbom-web-banking.log` |

---

## 5. `ROTATION_REQUIRED_BEFORE_DEPLOY`

Credenciais **previamente expostas** em `.env`, `.env.secrets.local` e backups — **rotacionar antes de qualquer deploy ou publicação**:

| Secret name | Classificação |
|-------------|---------------|
| `PROMETEO_API_KEY` | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `JWT_SESSION_SECRET` | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `JWT_NEURAL_SECRET` | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `GEMINI_API_KEY` | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `GEMINI_API_KEY_FALLBACK` | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `GOOGLE_VISION_API_KEY` | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `DATABASE_URL` (password component) | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `FIREBASE_API_KEY` | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `VITE_FIREBASE_API_KEY` | ROTATION_REQUIRED_BEFORE_DEPLOY (restringir no console + rebuild) |
| Firebase service account (GCP) | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `DATAVALID_API_KEY` | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `PEP_API_KEY` | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `TELEGRAM_BOT_TOKEN` | ROTATION_REQUIRED_BEFORE_DEPLOY |
| `PROMETEO_WEBHOOK_VERIFY_TOKEN` | ROTATION_REQUIRED_BEFORE_DEPLOY |

---

## 6. Limpeza de junk (`__MACOSX`, `._*`)

| Comando | Exit code | Resultado |
|---------|-----------|-----------|
| `find . \( -name '__MACOSX' -o -name '._*' \)` | **0** | **0 arquivos** — nada a remover |

---

## 7. Bloqueadores para handoff / deploy

| ID | Bloqueador | Ação |
|----|------------|------|
| B-SEC-01 | Rotação obrigatória de todos os secrets listados em §5 | Rotacionar no GCP Secret Manager / provedores antes de deploy |
| B-SEC-02 | `apps/web-banking/dist/` contém `VITE_FIREBASE_API_KEY` embutida | Excluir `dist/` do handoff; rebuild após rotação com `.env.example` apenas |
| B-SEC-03 | `npm audit` com 1 critical (`vitest`) e múltiplos high em Nest/multer | Planejar upgrade de dependências (major em Nest 11 / vitest 4) |
| B-SEC-04 | `bff/web-bff/.data/homolog-store.json` com material criptográfico de homolog | Não incluir em ZIP de produção; limpar ou regenerar store |
| B-SEC-05 | Credenciais legadas em `00-governance/audit-evidence` e `05-core-banking` | Excluir do artefato de distribuição ou sanitizar |

---

## 8. Resumo executivo

| Verificação | Resultado |
|-------------|-----------|
| `.env` removidos de `bff/web-bff` e `apps/web-banking` | **PASS** |
| `.env.example` com placeholders | **PASS** |
| Secret scan executado | **PASS** (achados documentados; exit 1 = leaks detectados) |
| `npm audit` nos 3 pacotes | **EXECUTADO** (exit 1 = vulnerabilidades presentes) |
| SBOM gerado | **PASS** (3 arquivos JSON) |
| Junk macOS | **PASS** (nenhum encontrado) |

**Condição para deploy:** rotação de secrets (§5) + rebuild web sem vazar chaves no `dist/` + triagem de vulnerabilidades npm.