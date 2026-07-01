> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

# 01 — Baseline Forense

**Supervisor:** Principal Software Engineer
**Timestamp UTC:** 2026-06-30T20:17:54Z
**Baseline canônica:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank`

## Decisão de baseline

| Critério | Eleve (canônica) | Paralelo `/Volumes/PRINCIPAL/regenera-bank` |
|----------|------------------|---------------------------------------------|
| Git | **NÃO** — diretório sem repositório | Sim — `main` @ `26654e26` |
| BFF NestJS integrado | `bff/web-bff` (53 arquivos src, mtime 30/06) | Stub Fastify em `04-bffs/` |
| Web banking homolog | `apps/web-banking` (38 src, mtime 30/06) | Scaffold maior, desatualizado |
| Core-bank consumido pelo BFF | `domains/core-bank` | Fragmentado em `05-core-banking/` |
| Trabalho ativo sessão 019f14ca | Sim | Não |

**Conclusão:** baseline canônica = **eleve projeto/regenera-bank**. Nenhuma promoção de código do workspace paralelo nesta execução — eleve é estritamente mais novo no stack BFF+web+KYC.

## Inventário

- **Arquivos (excl. node_modules):** 12.765
- **Pacotes críticos:** `domains/core-bank`, `bff/web-bff`, `apps/web-banking`
- **Sem git:** HEAD/diff/branch indisponíveis — rastreabilidade via hashes de arquivo pós-intervenção

## Agentes orquestrados (10)

| ID | Escopo | Ownership de edição |
|----|--------|---------------------|
| A01 | Baseline forense | `docs/audit/01-*` |
| A02 | Core banking | `domains/core-bank/` (read-only nesta fase) |
| A03 | Auth + password reset | `bff/web-bff/src/auth/` |
| A04 | KYC | `bff/web-bff/src/integrations/risk-kyc/`, `onboarding/` |
| A05 | Web banking | `apps/web-banking/` |
| A06 | BFF contratos | `bff/web-bff/src/` (exceto auth/KYC) |
| A07 | Task queue | investigação read-only |
| A08 | Testes | `artifacts/verification/` |
| A09 | Segurança | relatório only — secrets não removidos automaticamente |
| A10 | Auditoria independente | `docs/audit/09-*`, `10-*` |

## Pendências herdadas (pré-intervenção)

1. Forgot-password incompleto
2. BFF tests: VisionAdapter mock incompleto
3. KYC E2E usuário `d57t7A1W...` em `IN_REVIEW`
4. Web build TypeScript com erros
5. Secrets em `.env` e backups no disco
6. BullMQ/outbox relay ausente
7. Core-bank 100% in-memory (sem adapter Postgres)

## Intervenções desta execução (Supervisor)

- Recuperação de senha homolog: token SHA-256, rate limit, invalidação de sessões
- Firebase: `sendPasswordResetEmail` no hook
- Frontend: fluxo "Esqueci minha senha" em `LoginScreen`
- Fix mocks Vision + imagens de teste KYC
- BFF tests: 21/21 PASS