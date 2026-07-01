> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

# 11 — Git Baseline e Quarentena de Secrets

**Agente:** A01 (Git baseline & secrets quarantine)
**Timestamp UTC:** 2026-06-30T20:34:30Z
**Repositório:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank`
**Política:** `git init` + commit de preservação — **sem push, sem force, sem reset --hard**

---

## Resumo executivo

| Métrica | Valor |
|---------|-------|
| **Commit SHA** | `76237ded082352a8904e2d78b51174340c80b6c2` |
| **Tree hash** | `334081923b5d413aa82c211efdcb644c2bbf4b13` |
| **Branch** | `main` (default pós-`git init`) |
| **Arquivos rastreados (commit)** | 12.351 |
| **Arquivos hasheados (excl. node_modules/dist/.git/.env\*)** | 12.210 |
| **SHA-256 do manifesto de hashes** | `85f887764851d4d26e3747fd084a25e1f331cd2a91e9b9a9db64d48f8bf2cece` |
| **Remotes configurados** | 0 (nenhum push realizado) |
| **`.DS_Store` removidos (fora node_modules)** | 59 |

---

## 1. Quarentena de credentials (fora do repo)

**Diretório canônico:** `/Volumes/PRINCIPAL/Grok/.local-credentials/regenera-bank/`

| Arquivo movido (nome apenas) | Origem no repo |
|-----------------------------|----------------|
| `.env` | `bff/web-bff/.env` |
| `.env.secrets.local` | `bff/web-bff/.env.secrets.local` |
| `.env` | `apps/web-banking/.env` |
| `.env.backup.2026-06-30T12-45-37-802Z` | `artifacts/quarantine/env-backups/` |
| `.env.backup.2026-06-30T12-54-35-475Z` | `artifacts/quarantine/env-backups/` |
| `.env.backup.2026-06-30T15-46-05-604Z` | `artifacts/quarantine/env-backups/` |
| `.env.backup.2026-06-30T15-48-25-639Z` | `artifacts/quarantine/env-backups/` |
| `.env.backup.2026-06-30T16-07-13-162Z` | `artifacts/quarantine/env-backups/` |

**Destinos no diretório externo:**

```
.local-credentials/regenera-bank/
├── bff/web-bff/.env
├── bff/web-bff/.env.secrets.local
├── apps/web-banking/.env
└── env-backups/.env.backup.*
```

**Verificação pós-quarentena:** `find` no repo não retorna `.env`, `.env.secrets.local` nem `.env.backup.*` (exceto `.env.example`).

> **Nota de reconciliação:** Um agente paralelo havia movido os três `.env` principais para `artifacts/quarantine/env-backups/*.quarantined-*` segundos antes desta execução. Foram re-localizados para `.local-credentials/` conforme especificação.

---

## 2. Alterações em `.gitignore`

| Alteração | Detalhe |
|-----------|---------|
| Typo corrigido | `**/ .DS_Store` → `**/.DS_Store` |
| Adicionado | `__MACOSX/`, `._*` |
| Adicionado | `.local-credentials/`, `credentials/` |
| Adicionado | `*.pem`, `*.key`, `.data/` |
| Já existentes (mantidos) | `dist/`, `coverage/` (linhas 6–7 e 17–18) |

---

## 3. Limpeza de metadados macOS

- **59** arquivos `.DS_Store` removidos do working tree (excluindo `node_modules/`)
- **0** `.DS_Store` remanescentes fora de `node_modules/` após limpeza

---

## 4. Evidências Git (artefatos)

| Artefato | Caminho | No commit? |
|----------|---------|------------|
| Status pré-init | `artifacts/verification/git/status-before.txt` | Sim |
| Status pós-commit | `artifacts/verification/git/status-after.txt` | Não (capturado após commit) |
| HEAD | `artifacts/verification/git/head.txt` | Não |
| Tree listing | `artifacts/verification/git/tree.txt` | Não |
| Diff stat | `artifacts/verification/git/diff-stat.txt` | Não |
| Manifesto SHA-256 | `artifacts/verification/hashes/source-tree.sha256` | Sim |

### Status-before (pré-`git init`)

- **Arquivos inventariados:** 12.203 (excl. node_modules, dist, .git, .env\*)
- **Diretórios:** 5.909
- **Linhas no artefato:** 12.397

### Commit de preservação

```
chore: baseline de preservação pré-deploy — sem push
```

- **SHA:** `76237ded082352a8904e2d78b51174340c80b6c2`
- **Tree:** `334081923b5d413aa82c211efdcb644c2bbf4b13`

### Manifesto de integridade (`source-tree.sha256`)

- **Algoritmo:** SHA-256 (`shasum -a 256`)
- **Exclusões:** `node_modules/`, `dist/`, `.git/`, `.env*`
- **Entradas:** 12.210 arquivos
- **Hash do manifesto:** `85f887764851d4d26e3747fd084a25e1f331cd2a91e9b9a9db64d48f8bf2cece`
- **Método final:** `find -print0 | sort -z | xargs -0 -P 8 shasum` (paths com espaços suportados)

---

## 5. Blockers e riscos residuais

| ID | Severidade | Descrição | Mitigação |
|----|------------|-----------|-----------|
| B-01 | Info | Concorrência com agente paralelo na quarentena inicial | Reconciliado para `.local-credentials/` |
| B-02 | Info | Artefatos pós-commit (`head.txt`, `tree.txt`, etc.) não incluídos no commit baseline | Capturados em disco; podem ser adicionados em commit futuro se necessário |
| B-03 | Baixo | `node_modules/` e `dist/` presentes no disco mas ignorados pelo Git | Comportamento esperado; não entram no baseline |
| B-04 | Médio | Secrets removidos do repo — dev local requer restauração manual de `.local-credentials/` | Documentado; usar `npm run pull-secrets` ou cópia controlada |

**Nenhum blocker impede o baseline de preservação.**

---

## 6. Comandos de verificação independente

```bash
cd "/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank"

# Commit e tree
git rev-parse HEAD
git rev-parse HEAD^{tree}
git ls-tree -r HEAD --name-only | wc -l

# Ausência de secrets no repo
find . \( -name '.env' -o -name '.env.secrets.local' -o -name '.env.backup.*' \) \
  -not -path '*/node_modules/*' -not -name '*.example'

# Integridade do manifesto
shasum -a 256 artifacts/verification/hashes/source-tree.sha256
wc -l artifacts/verification/hashes/source-tree.sha256

# Confirmar sem remotes
git remote -v
```

---

## 7. Referências cruzadas

- Baseline forense anterior: `docs/audit/01-BASELINE-FORENSIC-INVENTORY.md`
- Security findings: `docs/audit/06-SECURITY-FINDINGS.md`
- Handoff deploy: `docs/audit/09-DEPLOYMENT-HANDOFF.md`