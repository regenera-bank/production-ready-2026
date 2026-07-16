# RUNBOOK-CORE-002 — Desbalanceamento de Ledger

**Severidade:** P0  
**Domínio:** Core Banking / Ledger  
**Trigger:** Trigger PostgreSQL rejeita DRAFT→POSTED ou alerta de view inconsistente

## Sintoma

`ValidationException` ao postar lançamento, ou soma D ≠ C em ambiente de homologação.

## O que NÃO fazer

- UPDATE manual em postings para "corrigir"
- DELETE de linhas erradas
- Desabilitar trigger em produção

## Diagnóstico

1. Identificar `journal_entry_id` em estado DRAFT
2. Listar postings com `ledger.service.verifyEntryHash`
3. Verificar moeda única e valores > 0
4. Revisar logs de idempotência — possível corrida não tratada

## Resolução

1. Se DRAFT: corrigir composição da partida **antes** de POSTED (ainda mutável em DRAFT)
2. Se POSTED incorreto (não deveria ocorrer — trigger): **incidente P0**
   - Congelar novos pagamentos (`CORE_PAYMENTS_ENABLED=false`)
   - Abrir reversal via `ledger.service.reverse`
   - Escalar Auditoria e CTO

## Pós-incidente

- Root cause em ADR se falha de design
- Adicionar teste invariante em `ledger.spec.ts`
- Evidência em `VALIDATION-REPORT.json`