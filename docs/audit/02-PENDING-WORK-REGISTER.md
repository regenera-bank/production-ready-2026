# 02 — Registro de Pendências

## Concluído nesta execução

| Item | Evidência |
|------|-----------|
| Forgot-password homolog (BFF) | `auth.service.ts` + controller + 3 testes |
| Forgot-password Firebase | `useFirebaseAuth.requestPasswordReset` |
| UI recuperação senha | `LoginScreen.tsx` + `bff-client.ts` |
| BFF tests Vision mock | `test-vision.mock.ts` — 21/21 PASS |
| BFF build + lint | exit 0 |

## Pendente — bloqueia GO pleno

| ID | Item | Bloqueio |
|----|------|----------|
| P01 | ~~Web-banking build~~ | **RESOLVIDO** — exit 0 |
| P02 | Git na baseline canônica | Workspace eleve sem repositório |
| P03 | Secrets no disco | Rotação + remoção backups `.env` |
| P04 | BullMQ / outbox relay | Não implementado — design only |
| P05 | Core-bank Postgres adapter | In-memory only |
| P06 | E2E homolog KYC real | Vision/DataValid produção |
| P07 | Entrega "50 melhorias + 10 agentes" texto | Sessão 019f14ca original |
| P08 | Passkeys vazios em homolog store | `passkeys: {}` |
| P09 | Email delivery password-reset prod | SMTP/Firebase apenas parcial |

## Pendente — pós-deploy

- Cloud Run / Firebase Hosting / DNS
- Migrations Postgres produtivas
- HSM, ICP-Brasil, BACEN (bloqueios externos documentados em AGENTS.md)