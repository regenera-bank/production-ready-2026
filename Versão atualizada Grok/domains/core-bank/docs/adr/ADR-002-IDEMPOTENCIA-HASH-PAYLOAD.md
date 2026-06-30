# ADR-002 — Idempotência Vinculada ao Hash do Payload

**Status:** Aceito  
**Data:** 2026-06-29  
**Domínio:** Core Banking  
**Autor:** Don Paulo Ricardo de Leão

## Contexto

Retries de rede, duplo clique no app e webhooks duplicados podem reexecutar a mesma operação financeira. Idempotência só pela chave HTTP permite sobrescrever intenção diferente com a mesma chave — incidente de perda ou duplicação de fundos.

## Decisão

1. `payloadHash = SHA-256(JSON.stringify(payload, Object.keys(payload).sort()))`
2. Mesma `idempotencyKey` + mesmo `payloadHash` → replay do `responseReference` (COMPLETED)
3. Mesma `idempotencyKey` + `payloadHash` diferente → `ConflictException` — nunca sobrescrever
4. Registro persiste: chave, hash, estado, `responseReference`, timestamps

## Estados

| Estado | Comportamento |
|--------|---------------|
| COMPLETED | Replay seguro |
| PROCESSING | Bloqueado — operação em andamento |
| FAILED_RETRYABLE | Pode adquirir e retentar |
| FAILED_FINAL | Terminal — intervenção manual |
| UNKNOWN | Bloqueado — reconciliação obrigatória (ADR-003) |

## Consequências

**Positivas**
- Drift de intenção detectado antes de efeito financeiro
- Replay seguro em falhas transitórias
- Evidência auditável por chave

**Negativas**
- Payload deve ser serializável de forma canônica
- Clientes devem usar chaves estáveis por intenção de negócio

## Alternativas rejeitadas

| Alternativa | Motivo |
|-------------|--------|
| Idempotência só por header | Permite payload diferente na mesma chave |
| TTL curto com overwrite | Perde evidência de conflito |
| Dedup só em Redis | Sem durabilidade regulatória |

## Referências

- AGENTS.md Regra 3
- `idempotency.service.ts` (PR-07)