# 06 — Security Findings

**Agente:** A09 (read-only scan)  
**Valores de secrets:** NÃO registrados neste documento

## Crítico

| ID | Finding | Path | Ação necessária |
|----|---------|------|-----------------|
| SEC-C01 | `.env` com secrets reais | `bff/web-bff/.env` | Rotacionar chaves; nunca commitar; excluir de ZIP handoff |
| SEC-C02 | `.env.secrets.local` | `bff/web-bff/.env.secrets.local` | Remover do tree de distribuição |
| SEC-C03 | 5 backups `.env.backup.*` | `bff/web-bff/` | Deletar após rotação |
| SEC-C04 | Frontend `.env` Firebase | `apps/web-banking/.env` | Usar `.env.example` no handoff |

## Alto

| ID | Finding | Path |
|----|---------|------|
| SEC-H01 | DEVICE_SECRET hardcoded | `00-governance/audit-evidence/.../package-lock.json` (misnamed source) |
| SEC-H02 | Firebase apiKey em fontes arquivadas | `00-governance/audit-evidence/pipeline-green-v4/...` |
| SEC-H03 | Credenciais sandbox hardcoded | `05-core-banking/.../open-finance.service.ts` |

## Médio

| ID | Finding |
|----|---------|
| SEC-M01 | 59× `.DS_Store` no tree |
| SEC-M02 | `.gitignore` typo `**/ .DS_Store` |
| SEC-M03 | GCP project IDs em scripts |
| SEC-M04 | `dist/` artifacts locais |

## Correções nesta execução

- Password reset: token armazenado como SHA-256; auditoria sem token em claro
- Logs KYC: sem documento/selfie em logs (já existente em kyc-engine)

## Não executado

- `git filter-repo` / revogação histórica — proibido nesta fase
- Rotação efetiva de credenciais — responsabilidade pré-deploy