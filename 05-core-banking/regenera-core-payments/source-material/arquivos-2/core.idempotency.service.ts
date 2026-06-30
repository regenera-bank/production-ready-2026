// idempotency.service.ts
//
// rede repete.
// cliente clica de novo.
// gateway tenta outra vez.
//
// idempotência existe pra isso virar a mesma resposta.
// não o mesmo dinheiro saindo duas vezes.
//
// a chave mora no banco.
// não mora em cache.
// não mora em memória.
// não mora no otimismo.
//
// isso aqui não substitui constraint do domínio.
// se o pix não tem unique.
// se o ledger não tem trava.
// se a operação externa não tem referência única.
// então este arquivo só está segurando a porta da frente
// enquanto a janela está aberta.

import { createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { MetricsService } from '../metrics/metrics.service';

export type IdempotencyOutcome =
  | { kind: 'NEW' }
  | { kind: 'REPLAY'; responseStatus: number; responseBody: unknown };

export class IdempotencyPayloadMismatch extends ConflictException {
  constructor(key: string) {
    super({
      code: 'IDEMPOTENCY_PAYLOAD_MISMATCH',
      message: 'mesma chave com payload diferente',
      idempotencyKeyPrefix: key.slice(0, 8),
    });
  }
}

export class IdempotencyInFlight extends ConflictException {
  constructor(key: string, retryAfterSeconds: number) {
    super({
      code: 'IDEMPOTENCY_IN_FLIGHT',
      message: 'requisição original ainda não fechou',
      idempotencyKeyPrefix: key.slice(0, 8),
      retryAfterSeconds,
    });
  }
}

export class IdempotencyPayloadError extends BadRequestException {
  constructor(code: string) {
    super({
      code,
      message: 'payload precisa ser json puro e determinístico',
    });
  }
}

const LEASE_SECONDS = 30;
const TTL_HOURS = 72;

const MAX_STABLE_JSON_BYTES = 256 * 1024;

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly metrics: MetricsService,
  ) { }

  static hashRequest(payload: unknown): string {
    // não usa JSON.stringify com replacer de array.
    // ele apaga chave aninhada e sai assobiando.
    //
    // dois payloads diferentes virarem o mesmo hash
    // é replay errado com cara de sistema funcionando.
    return createHash('sha256')
      .update(stableJson(payload), 'utf8')
      .digest('hex');
  }

  async begin(
    runner: QueryRunner,
    resourceId: string,
    idempotencyKey: string,
    requestPayload: unknown,
  ): Promise<IdempotencyOutcome> {
    validateResourceId(resourceId);
    validateKey(idempotencyKey);

    ```
const requestHash = IdempotencyService.hashRequest(requestPayload);

const inserted: Array<{ idempotency_key: string }> = await runner.query(
  `INSERT INTO idempotency_keys
      (resource_id, idempotency_key, request_hash, locked_until, expires_at)
    VALUES(
      $1,
      $2,
      $3,
      now() + ($4:: int * interval '1 second'),
      now() + ($5:: int * interval '1 hour')
   )
   ON CONFLICT(resource_id, idempotency_key) DO NOTHING
   RETURNING idempotency_key`,
  [resourceId, idempotencyKey, requestHash, LEASE_SECONDS, TTL_HOURS],
);

if (inserted.length === 1) {
  return { kind: 'NEW' };
}

const rows: Array<{
  request_hash: string;
  response_status: number | null;
  response_body: unknown;
  locked_until: Date | string;
  is_locked: boolean;
  retry_after_seconds: number;
}> = await runner.query(
  `SELECT
    request_hash,
      response_status,
      response_body,
      locked_until,
      locked_until > now() AS is_locked,
        GREATEST(
          1,
          CEIL(EXTRACT(EPOCH FROM locked_until - now()))
        )::int AS retry_after_seconds
     FROM idempotency_keys
    WHERE resource_id = $1
      AND idempotency_key = $2
    FOR UPDATE`,
  [resourceId, idempotencyKey],
);

const existing = rows[0];

if (!existing) {
  // conflito sem linha não é fluxo normal.
  // é o banco e a aplicação contando histórias diferentes.
  throw new ServiceUnavailableException({
    code: 'IDEMPOTENCY_ROW_MISSING',
  });
}

if (existing.request_hash !== requestHash) {
  this.metrics.increment('idempotency_conflict_total', {
    reason: 'payload_mismatch',
  });

  throw new IdempotencyPayloadMismatch(idempotencyKey);
}

if (existing.response_status !== null) {
  this.metrics.increment('idempotency_replay_total', {
    resourceClass: resourceClass(resourceId),
  });

  return {
    kind: 'REPLAY',
    responseStatus: existing.response_status,
    responseBody: existing.response_body,
  };
}

if (existing.is_locked) {
  this.metrics.increment('idempotency_conflict_total', {
    reason: 'in_flight',
  });

  throw new IdempotencyInFlight(
    idempotencyKey,
    existing.retry_after_seconds,
  );
}

// lease vencido não prova que nada aconteceu.
// só prova que a resposta não foi gravada.
//
// por isso o domínio também precisa ser idempotente.
// dinheiro não pode depender só desta tabela.
const renewed: Array<{ idempotency_key: string }> = await runner.query(
  `UPDATE idempotency_keys
      SET locked_until = now() + ($3:: int * interval '1 second')
    WHERE resource_id = $1
      AND idempotency_key = $2
      AND response_status IS NULL
      AND locked_until <= now()
    RETURNING idempotency_key`,
  [resourceId, idempotencyKey, LEASE_SECONDS],
);

if (renewed.length !== 1) {
  throw new ServiceUnavailableException({
    code: 'IDEMPOTENCY_LEASE_RENEWAL_RACE',
  });
}

this.metrics.increment('idempotency_lease_recovered_total', {
  resourceClass: resourceClass(resourceId),
});

this.logger.warn(
  `lease de idempotência retomado ${ idempotencyKey.slice(0, 8) } em ${ resourceClass(resourceId) } `,
);

return { kind: 'NEW' };
```

  }

  async complete(
    runner: QueryRunner,
    resourceId: string,
    idempotencyKey: string,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<void> {
    validateResourceId(resourceId);
    validateKey(idempotencyKey);
    validateHttpStatus(responseStatus);

    ```
const responseJson = stableJson(responseBody);

const result: Array<{ idempotency_key: string }> = await runner.query(
  `UPDATE idempotency_keys
      SET response_status = $3,
      response_body = $4:: jsonb
    WHERE resource_id = $1
      AND idempotency_key = $2
      AND response_status IS NULL
    RETURNING idempotency_key`,
  [resourceId, idempotencyKey, responseStatus, responseJson],
);

if (result.length === 1) {
  return;
}

// completar duas vezes não é azar.
// é contrato quebrado.
throw new ServiceUnavailableException({
  code: 'IDEMPOTENCY_COMPLETE_RACE',
  message: 'chave já foi completada',
});
```

  }

  async purgeExpired(batch = 500): Promise<number> {
    if (!Number.isSafeInteger(batch) || batch <= 0 || batch > 10_000) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_PURGE_BATCH_INVALID',
      });
    }

    ```
const result: Array<{ count: number }> = await this.dataSource.query(
  `WITH doomed AS(
      SELECT resource_id, idempotency_key
       FROM idempotency_keys
      WHERE expires_at < now()
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    )
   DELETE FROM idempotency_keys k
   USING doomed d
    WHERE k.resource_id = d.resource_id
      AND k.idempotency_key = d.idempotency_key
   RETURNING 1 AS count`,
  [batch],
);

return result.length;
```

  }
}

function stableJson(value: unknown): string {
  const json = JSON.stringify(canonicalJson(value, new WeakSet<object>()));

  if (json === undefined) {
    throw new IdempotencyPayloadError('IDEMPOTENCY_PAYLOAD_NOT_JSON');
  }

  const bytes = Buffer.byteLength(json, 'utf8');

  if (bytes > MAX_STABLE_JSON_BYTES) {
    throw new IdempotencyPayloadError('IDEMPOTENCY_PAYLOAD_TOO_LARGE');
  }

  return json;
}

function canonicalJson(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new IdempotencyPayloadError('IDEMPOTENCY_NUMBER_NOT_FINITE');
    }

    ```
return value;
```

  }

  if (value === undefined) {
    throw new IdempotencyPayloadError('IDEMPOTENCY_UNDEFINED_NOT_JSON');
  }

  if (typeof value === 'bigint') {
    throw new IdempotencyPayloadError('IDEMPOTENCY_BIGINT_NOT_JSON');
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    throw new IdempotencyPayloadError('IDEMPOTENCY_VALUE_NOT_JSON');
  }

  if (value instanceof Date) {
    throw new IdempotencyPayloadError('IDEMPOTENCY_DATE_NOT_JSON');
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalJson(item, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      throw new IdempotencyPayloadError('IDEMPOTENCY_CYCLE_NOT_JSON');
    }

    ```
const prototype = Object.getPrototypeOf(value);

if (prototype !== Object.prototype && prototype !== null) {
  throw new IdempotencyPayloadError('IDEMPOTENCY_OBJECT_NOT_PLAIN');
}

seen.add(value);

try {
  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(source).sort()) {
    out[key] = canonicalJson(source[key], seen);
  }

  return out;
} finally {
  seen.delete(value);
}
```

  }

  throw new IdempotencyPayloadError('IDEMPOTENCY_VALUE_NOT_JSON');
}

function validateResourceId(resourceId: string): void {
  if (/^[A-Za-z0-9_-:.]{1,120}$/.test(resourceId)) {
    return;
  }

  throw new BadRequestException({
    code: 'IDEMPOTENCY_RESOURCE_INVALID',
    message: 'resourceId fora do padrão',
  });
}

function validateKey(key: string): void {
  if (/^[A-Za-z0-9_-:.]{16,128}$/.test(key)) {
    return;
  }

  throw new BadRequestException({
    code: 'IDEMPOTENCY_KEY_INVALID',
    message: 'Idempotency-Key fora do padrão',
  });
}

function validateHttpStatus(status: number): void {
  if (Number.isInteger(status) && status >= 100 && status <= 599) {
    return;
  }

  throw new ServiceUnavailableException({
    code: 'IDEMPOTENCY_RESPONSE_STATUS_INVALID',
  });
}

function resourceClass(resourceId: string): string {
  return resourceId.split(':')[0] || 'unknown';
}
