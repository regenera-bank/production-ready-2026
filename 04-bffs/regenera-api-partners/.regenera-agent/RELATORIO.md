# Relatório do regenera-agent

Gerado em 2026-06-25T16:13:14.081Z · motor `heuristic` · **APLICADO no lugar**

## Comments / AI-signal removal / High

| resultado | arquivos |
|---|---:|
| reescrito (passou no portão) | 1 |
| já limpo | 12 |
| **rejeitado** (código teria mudado → descartado) | 0 |

## Gate / Code-preservation proof / Critical

Todo arquivo reescrito tem `hash_antes` e `hash_depois` no `ledger.json`. O portão removeu
comentário dos dois lados e comparou o código byte a byte. Comportamento: **inalterado**, por construção.

| arquivo | status | sinal removido | hash antes → depois |
|---|---|---|---|
| `contracts/asyncapi.yaml` | já limpo | — | `9557eb50` → `9557eb50` |
| `contracts/openapi.yaml` | já limpo | — | `cf56d26d` → `cf56d26d` |
| `deploy/kubernetes/deployment.yaml` | já limpo | — | `e1a16c5e` → `e1a16c5e` |
| `src/auth.ts` | já limpo | — | `06a728ea` → `06a728ea` |
| `src/canonical-json.ts` | já limpo | — | `8040114f` → `8040114f` |
| `src/config.ts` | já limpo | — | `13e57048` → `13e57048` |
| `src/core-client.ts` | já limpo | — | `bd11f2c1` → `bd11f2c1` |
| `src/idempotency.ts` | reescrito | — | `ec5ee641` → `9cb82178` |
| `src/routes.ts` | já limpo | — | `a8e600f3` → `a8e600f3` |
| `src/schemas.ts` | já limpo | — | `c7a3d8c0` → `c7a3d8c0` |
| `src/server.ts` | já limpo | — | `5ef3cf1f` → `5ef3cf1f` |
| `src/webhook-signature.ts` | já limpo | — | `63cd4b99` → `63cd4b99` |
| `tests/contracts.test.ts` | já limpo | — | `8310fc40` → `8310fc40` |
