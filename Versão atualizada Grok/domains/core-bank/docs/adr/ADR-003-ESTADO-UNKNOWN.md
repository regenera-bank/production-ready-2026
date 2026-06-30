# ADR-003 — Estado UNKNOWN Sagrado

**Status:** Aceito  
**Data:** 2026-06-29  
**Domínio:** Core Banking  
**Autor:** Don Paulo Ricardo de Leão

## Contexto

Integrações com SPI, correspondentes e adquirentes podem sofrer timeout sem confirmação de liquidação. Classificar timeout como FAILED e retentar automaticamente pode duplicar débito ou creditar indevidamente — risco regulatório e operacional.

## Decisão

1. Ausência de resposta externa após envio → estado `UNKNOWN`, nunca `FAILED` automático
2. `UNKNOWN` **bloqueia** retry automático e nova execução com mesma chave
3. Saída exclusiva via reconciliação com evidência externa:
   - `SETTLED` — mantém efeito financeiro
   - `REJECTED` — partida compensatória restaura saldo
4. Reconciliação exige maker-checker (segunda identidade)

## Fluxo

```
SENT → (timeout) → UNKNOWN
UNKNOWN → RECONCILED_SETTLED | RECONCILED_REJECTED
```

Retry automático de `UNKNOWN` → `StateTransitionException`

## Consequências

**Positivas**
- Elimina duplicação por retry cego
- Força evidência antes de decisão final
- Alinhado a práticas de participantes SPI

**Negativas**
- Fila de reconciliação manual em incidentes
- UX deve comunicar "em processamento" sem prometer liquidação

## Alternativas rejeitadas

| Alternativa | Motivo |
|-------------|--------|
| FAILED + retry exponencial | Duplicação de fundos |
| Polling agressivo sem limite | Mascara UNKNOWN |
| Estorno automático em timeout | Pode estornar operação que liquidou |

## Referências

- AGENTS.md Regra 4
- `RUNBOOK-CORE-001-UNKNOWN.md`
- Manual Pix BACEN (incerteza de liquidação)