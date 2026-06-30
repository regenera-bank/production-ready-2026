# Relatório do regenera-agent

Gerado em 2026-06-29T21:50:47.126Z · motor `heuristic` · dry-run (propostas em `.regenera-agent/proposto/`)

## Comments / AI-signal removal / High

| resultado | arquivos |
|---|---:|
| reescrito (passou no portão) | 0 |
| já limpo | 5 |
| **rejeitado** (código teria mudado → descartado) | 0 |

## Gate / Code-preservation proof / Critical

Todo arquivo reescrito tem `hash_antes` e `hash_depois` no `ledger.json`. O portão removeu
comentário dos dois lados e comparou o código byte a byte. Comportamento: **inalterado**, por construção.

| arquivo | status | sinal removido | hash antes → depois |
|---|---|---|---|
| `app.module.ts` | já limpo | — | `939e1663` → `939e1663` |
| `core-bank-health.controller.ts` | já limpo | — | `bfde1b26` → `bfde1b26` |
| `main.ts` | já limpo | — | `2c1fe61c` → `2c1fe61c` |
| `money/money.value-object.spec.ts` | já limpo | — | `8069056e` → `8069056e` |
| `money/money.value-object.ts` | já limpo | — | `bae9f308` → `bae9f308` |
