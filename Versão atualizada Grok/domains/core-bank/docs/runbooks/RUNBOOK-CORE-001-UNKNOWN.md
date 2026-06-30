# RUNBOOK-CORE-001 — Pagamento em UNKNOWN

**Severidade:** P1  
**Domínio:** Core Banking / Payments  
**Trigger:** `core_idempotency_unknown_total` > 5 em 5 minutos

## Sintoma

Pagamento em estado `UNKNOWN` após timeout de integração externa (SPI, correspondente, adquirente). Cliente vê "em processamento". Saldo pode estar reservado por hold.

## O que NÃO fazer

- Retry automático da operação
- Marcar como FAILED sem evidência
- UPDATE em `journal_entries` ou `ledger_postings`

## Diagnóstico

1. Localizar `payment_id` e `idempotency_key` nos logs (correlation ID)
2. Verificar estado em `payments` e `idempotency_records`
3. Consultar evidência externa: arquivo de retorno, portal SPI sandbox, ticket do correspondente
4. Confirmar holds ativos em `available_balances` view

## Resolução

| Evidência externa | Ação | Papel |
|-------------------|------|-------|
| Liquidação confirmada | `reconcile(SETTLED)` | Maker + Checker |
| Rejeição confirmada | `reconcile(REJECTED)` — reversal automático | Maker + Checker |
| Sem evidência após SLA | Escalar compliance; manter UNKNOWN | Operações + Jurídico |

## Pós-incidente

- Registrar em `audit_events` com `previousHash` válido
- Atualizar ticket com hash do lançamento e evidência anexada
- Revisar timeout da integração se recorrente