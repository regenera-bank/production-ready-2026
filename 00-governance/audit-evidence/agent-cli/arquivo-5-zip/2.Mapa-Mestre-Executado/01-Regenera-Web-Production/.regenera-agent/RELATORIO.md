# Relatório do regenera-agent

Gerado em 2026-06-25T16:13:13.620Z · motor `heuristic` · **APLICADO no lugar**

## Comments / AI-signal removal / High

| resultado | arquivos |
|---|---:|
| reescrito (passou no portão) | 0 |
| já limpo | 24 |
| **rejeitado** (código teria mudado → descartado) | 0 |

## Gate / Code-preservation proof / Critical

Todo arquivo reescrito tem `hash_antes` e `hash_depois` no `ledger.json`. O portão removeu
comentário dos dois lados e comparou o código byte a byte. Comportamento: **inalterado**, por construção.

| arquivo | status | sinal removido | hash antes → depois |
|---|---|---|---|
| `contracts/openapi.yaml` | já limpo | — | `cf56d26d` → `cf56d26d` |
| `middleware.ts` | já limpo | — | `900f9e36` → `900f9e36` |
| `next-env.d.ts` | já limpo | — | `7b550dda` → `7b550dda` |
| `next.config.mjs` | já limpo | — | `a0d754f7` → `a0d754f7` |
| `src/app/api/bff/accounts/[accountId]/balance/route.ts` | já limpo | — | `778f9de5` → `778f9de5` |
| `src/app/api/bff/accounts/[accountId]/transactions/route.ts` | já limpo | — | `c94b1276` → `c94b1276` |
| `src/app/api/bff/accounts/route.ts` | já limpo | — | `6d12a684` → `6d12a684` |
| `src/app/api/bff/pix/route.ts` | já limpo | — | `95d20565` → `95d20565` |
| `src/app/api/session/callback/route.ts` | já limpo | — | `e0bf0ae4` → `e0bf0ae4` |
| `src/app/api/session/login/route.ts` | já limpo | — | `6a3ef0c7` → `6a3ef0c7` |
| `src/app/api/session/logout/route.ts` | já limpo | — | `417e2943` → `417e2943` |
| `src/app/banking/accounts/[accountId]/statements/page.tsx` | já limpo | — | `9bc68634` → `9bc68634` |
| `src/app/banking/layout.tsx` | já limpo | — | `b6dbe95c` → `b6dbe95c` |
| `src/app/banking/page.tsx` | já limpo | — | `ef4c7348` → `ef4c7348` |
| `src/app/banking/pix/page.tsx` | já limpo | — | `e6cbaed7` → `e6cbaed7` |
| `src/app/error.tsx` | já limpo | — | `915cc913` → `915cc913` |
| `src/app/layout.tsx` | já limpo | — | `d6916e11` → `d6916e11` |
| `src/app/login/page.tsx` | já limpo | — | `097d154a` → `097d154a` |
| `src/app/page.tsx` | já limpo | — | `96d9a4ed` → `96d9a4ed` |
| `src/components/BankNavigation.tsx` | já limpo | — | `c6d8ae0f` → `c6d8ae0f` |
| `src/lib/contracts.test.ts` | já limpo | — | `054ea378` → `054ea378` |
| `src/lib/contracts.ts` | já limpo | — | `5e0aaf9b` → `5e0aaf9b` |
| `src/lib/server/core-client.ts` | já limpo | — | `096167ad` → `096167ad` |
| `src/lib/server/session.ts` | já limpo | — | `eb521d2e` → `eb521d2e` |
