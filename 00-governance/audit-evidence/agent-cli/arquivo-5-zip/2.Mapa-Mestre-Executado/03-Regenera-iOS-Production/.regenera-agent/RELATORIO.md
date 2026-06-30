# Relatório do regenera-agent

Gerado em 2026-06-25T16:13:13.852Z · motor `heuristic` · **APLICADO no lugar**

## Comments / AI-signal removal / High

| resultado | arquivos |
|---|---:|
| reescrito (passou no portão) | 0 |
| já limpo | 3 |
| **rejeitado** (código teria mudado → descartado) | 0 |

## Gate / Code-preservation proof / Critical

Todo arquivo reescrito tem `hash_antes` e `hash_depois` no `ledger.json`. O portão removeu
comentário dos dois lados e comparou o código byte a byte. Comportamento: **inalterado**, por construção.

| arquivo | status | sinal removido | hash antes → depois |
|---|---|---|---|
| `contracts/openapi.yaml` | já limpo | — | `cf56d26d` → `cf56d26d` |
| `project.yml` | já limpo | — | `15545631` → `15545631` |
| `scripts/verify-release.sh` | já limpo | — | `aa1ac631` → `aa1ac631` |
