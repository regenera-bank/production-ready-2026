# ADR-001 — Ledger Append-Only

**Status:** Aceito  
**Data:** 2026-06-29  
**Domínio:** Core Banking  
**Autor:** Don Paulo Ricardo de Leão

## Contexto

Lançamentos financeiros em bancos são evidência regulatória. UPDATE ou DELETE em `journal_entries` e `ledger_postings` destrói trilha de auditoria e impede reconciliação com SPI, correspondentes e auditor externo.

O scaffold Kotlin (`JournalEntry.kt`) já valida D=C em memória, mas não impõe imutabilidade no banco.

## Decisão

1. `journal_entries` e `ledger_postings` são **append-only**.
2. Correção financeira = nova partida compensatória com `reversalOf` apontando para o lançamento original.
3. Triggers PostgreSQL em `BEFORE UPDATE` e `BEFORE DELETE` lançam exceção — não é convenção de aplicação.
4. Transição DRAFT→POSTED valida D=C e moeda única; POSTED é terminal (exceto via reversão).

## Consequências

**Positivas**
- Trilha imutável para diligência e BACEN
- Reversão explícita e auditável
- Saldo derivado exclusivamente de projeção de postings

**Negativas**
- Correções exigem partida compensatória (mais linhas, mais complexidade operacional)
- Migrations e seeds devem respeitar o contrato desde V001

## Alternativas rejeitadas

| Alternativa | Motivo |
|-------------|--------|
| Soft-delete com flag `deleted_at` | Ainda permite alteração de histórico percebido |
| Saldo em coluna mutável | Drift entre coluna e razão |
| Correção via UPDATE do posting | Viola evidência append-only |

## Referências

- AGENTS.md Regra 2
- Res. BACEN 4.753/2019 (rastreabilidade)
- `RUNBOOK-CORE-002-LEDGER-IMBALANCE.md`