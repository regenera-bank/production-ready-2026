> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

# 13 — BullMQ + Redis Audit (Gate G9)

**Agente:** A03 (outbox relay worker)
**Baseline:** `/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank`
**Data:** 2026-06-30
**Gate:** G9 — Task queue BullMQ + outbox relay

---

## 1. Escopo entregue

| Requisito | Status | Evidência |
|-----------|--------|-----------|
| Pacote `workers/outbox-relay/` | ✅ | Ver §2 |
| Dependências `bullmq`, `ioredis` | ✅ | `package.json` |
| Redis config centralizado `REDIS_URL` | ✅ | `src/redis.config.ts` |
| TLS quando `rediss://` | ✅ | `buildRedisConnectionConfig()` |
| Fila `core-bank.outbox.v1` | ✅ | `src/constants.ts` |
| Job versionado `outbox.relay.v1` | ✅ | `src/outbox-producer.ts` |
| Validação de payload | ✅ | `src/schema.ts` |
| Retries max 3 + backoff exponencial | ✅ | `OUTBOX_MAX_ATTEMPTS`, `OUTBOX_BACKOFF_DELAY_MS` |
| Timeout 30s | ✅ | `OUTBOX_JOB_TIMEOUT_MS` + `withTimeout()` |
| Dead-letter queue | ✅ | `core-bank.outbox.v1.dlq` |
| Graceful shutdown SIGTERM | ✅ | `src/main.ts` |
| Health check HTTP `/health` | ✅ | `src/health.ts` |
| Correlation ID em logs JSON | ✅ | `src/logger.ts` |
| Idempotência por `outboxEventId` | ✅ | `jobId` + skip se `publishedAt` preenchido |
| Integração outbox `published_at` | ✅ | `OutboxStore.markPublished()` + teste core-bank |
| Testes com Redis real | ✅ | `outbox-relay.integration.spec.ts` |

---

## 2. Arquivos criados

```
workers/outbox-relay/
├── package.json
├── package-lock.json
├── tsconfig.json
├── jest.config.js
└── src/
    ├── constants.ts
    ├── schema.ts
    ├── logger.ts
    ├── outbox-store.ts
    ├── in-memory-outbox-store.ts
    ├── redis.config.ts
    ├── outbox-producer.ts
    ├── outbox-worker.ts
    ├── health.ts
    ├── main.ts
    └── outbox-relay.integration.spec.ts
```

---

## 3. Comandos, exit codes e logs

| Comando | CWD | Exit | Log |
|---------|-----|------|-----|
| `redis-cli ping` | — | **0** | `PONG` |
| `npm install` | `workers/outbox-relay` | **0** | 301 packages, 0 vulnerabilities |
| `npm run build` | `workers/outbox-relay` | **0** | `artifacts/verification/build/outbox-relay-build.log` |
| `npm run test:redis` | `workers/outbox-relay` | **0** | `artifacts/verification/unit/outbox-relay-redis-test.log` |

### Redis ping

```
$ redis-cli ping
PONG
REDIS_PING_EXIT:0
```

### Build

```
$ npm run build
> tsc -p tsconfig.json
BUILD_EXIT:0
```

### Testes integração (Redis real)

```
$ npm run test:redis
Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
TEST_REDIS_EXIT:0
```

Suites:

| Teste | Resultado |
|-------|-----------|
| processa job e marca published_at no outbox | PASS |
| job idempotente — mesmo outboxEventId não duplica efeito | PASS |
| rejeita payload inválido sem marcar published_at | PASS |
| health check reporta redis e worker ok | PASS |
| integra com OutboxService do core-bank | PASS |

---

## 4. Configuração operacional

| Variável | Default | Uso |
|----------|---------|-----|
| `REDIS_URL` | `redis://localhost:6379` | Conexão BullMQ + health ping |
| `OUTBOX_RELAY_HEALTH_PORT` | `3109` | HTTP `/health` e `/healthz` |

Scripts npm:

```json
"build": "tsc -p tsconfig.json",
"start": "node dist/main.js",
"test:redis": "jest --runInBand --forceExit --testPathPattern=integration.spec.ts"
```

---

## 5. Arquitetura resumida

```
OutboxProducer.enqueue()
    → Queue core-bank.outbox.v1 (job: outbox.relay.v1, jobId = outboxEventId)
        → OutboxRelayWorker.processJob()
            → validateOutboxRelayPayload()
            → skip se publishedAt != null (idempotente)
            → RelayPublisher.publish()
            → OutboxStore.markPublished()
        → falha final → DLQ core-bank.outbox.v1.dlq
```

---

## 6. Blockers / riscos residuais

| ID | Blocker | Severidade | Mitigação |
|----|---------|------------|-----------|
| B01 | `main.ts` usa `InMemoryOutboxStore` — não persiste em Postgres | Alto | Implementar `PostgresOutboxStore` adapter antes de produção |
| B02 | Jest requer `--forceExit` (handles BullMQ abertos após suite) | Baixo | Aceitável em CI; investigar `worker.close()` + `Queue.close()` em `afterAll` |
| B03 | `@regenera/core-bank` não exporta outbox no `public-api` | Médio | Adapter dedicado ou export formal em PR futuro |
| B04 | RelayPublisher default só loga — sem broker externo (Kafka/SNS) | Médio | Injetar publisher real no deploy |
| B05 | Polling de eventos pendentes (producer batch) não implementado | Médio | Cron/scheduler que chama `OutboxService.pending()` → `enqueue()` |

**Gate G9:** ✅ **PASS** para implementação BullMQ + Redis com testes reais. Deploy produção condicionado a B01 e B04.

---

## 7. Veredito

BullMQ + Redis outbox relay implementado conforme especificação G9. Testes de integração executados contra Redis local (`redis-cli ping` → PONG). Evidência reproduzível nos logs em `artifacts/verification/`.