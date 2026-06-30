// idempotency.service.ts
//
// a rede vai repetir requisição. o app mobile vai reenviar no timeout.
// o gateway vai fazer retry. este serviço existe pra que tudo isso
// resulte em UM débito e a mesma resposta, byte a byte.
// a fonte de verdade é a tabela com primary key — não cache, não memória.

import { createHash } from 'crypto';
import {
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
      message: `Chave de idempotência reutilizada com payload diferente`,
      idempotencyKeyPrefix: key.slice(0, 8),
    });
  }
}

export class IdempotencyInFlight extends ConflictException {
  constructor(key: string, retryAfterSeconds: number) {
    super({
      code: 'IDEMPOTENCY_IN_FLIGHT',
      message: 'Requisição original ainda em processamento',
      idempotencyKeyPrefix: key.slice(0, 8),
      retryAfterSeconds,
    });
  }
}

const LEASE_SECONDS = 30;
const TTL_HOURS = 72;

// ordena chaves de objeto em TODOS os níveis antes de serializar.
//
// a versão anterior fazia JSON.stringify(payload, chaves.sort()) — replacer
// de array no JS filtra chave em todo nível da árvore, então payload
// aninhado com chave fora da lista do topo simplesmente sumia do hash.
// dois pedidos diferentes podiam virar o mesmo hash e o segundo levava
// replay do primeiro. com dinheiro. corrigido aqui, com teste cobrindo.
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize); // ordem de array é semântica, não se mexe
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly metrics: MetricsService,
  ) {}

  static hashRequest(payload: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(canonicalize(payload)), 'utf8')
      .digest('hex');
  }

  // INSERT ... ON CONFLICT DO NOTHING é a disputa inteira resolvida pelo
  // banco: quem inseriu processa, quem conflitou vai descobrir o que houve
  // com o original. sem advisory lock, sem redis, sem reza.
  async begin(
    runner: QueryRunner,
    resourceId: string,
    idempotencyKey: string,
    requestPayload: unknown,
  ): Promise<IdempotencyOutcome> {
    this.validateKey(idempotencyKey);
    const requestHash = IdempotencyService.hashRequest(requestPayload);

    const inserted: Array<{ idempotency_key: string }> = await runner.query(
      `INSERT INTO idempotency_keys
         (resource_id, idempotency_key, request_hash, locked_until, expires_at)
       VALUES ($1, $2, $3, now() + make_interval(secs => $4),
               now() + make_interval(hours => $5))
       ON CONFLICT (resource_id, idempotency_key) DO NOTHING
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
      locked_until: Date;
    }> = await runner.query(
      `SELECT request_hash, response_status, response_body, locked_until
         FROM idempotency_keys
        WHERE resource_id = $1 AND idempotency_key = $2
        FOR UPDATE`,
      [resourceId, idempotencyKey],
    );
    const existing = rows[0];

    // mesma chave, payload diferente = ou bug no cliente ou alguém
    // tentando reaproveitar chave. os dois casos merecem 409, não débito.
    if (existing.request_hash !== requestHash) {
      this.metrics.increment('idempotency_conflict_total', { reason: 'payload_mismatch' });
      throw new IdempotencyPayloadMismatch(idempotencyKey);
    }

    if (existing.response_status !== null) {
      this.metrics.increment('idempotency_replay_total', { resource: resourceId });
      return {
        kind: 'REPLAY',
        responseStatus: existing.response_status,
        responseBody: existing.response_body,
      };
    }

    const lockedUntil = new Date(existing.locked_until).getTime();
    if (lockedUntil > Date.now()) {
      this.metrics.increment('idempotency_conflict_total', { reason: 'in_flight' });
      throw new IdempotencyInFlight(
        idempotencyKey,
        Math.ceil((lockedUntil - Date.now()) / 1000),
      );
    }

    // lease vencido = o processo original morreu no meio. a transação dele
    // deu rollback junto, então retomar daqui é seguro. fica no log porque
    // lease vencendo com frequência é sintoma, não rotina.
    await runner.query(
      `UPDATE idempotency_keys
          SET locked_until = now() + make_interval(secs => $3)
        WHERE resource_id = $1 AND idempotency_key = $2`,
      [resourceId, idempotencyKey, LEASE_SECONDS],
    );
    this.logger.warn(
      `Lease de idempotência retomado para ${idempotencyKey.slice(0, 8)}… em ${resourceId}`,
    );
    return { kind: 'NEW' };
  }

  async complete(
    runner: QueryRunner,
    resourceId: string,
    idempotencyKey: string,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<void> {
    const result = await runner.query(
      `UPDATE idempotency_keys
          SET response_status = $3, response_body = $4::jsonb
        WHERE resource_id = $1 AND idempotency_key = $2
          AND response_status IS NULL
        RETURNING idempotency_key`,
      [resourceId, idempotencyKey, responseStatus, JSON.stringify(responseBody)],
    );
    if (result.length === 0) {
      // dentro da mesma transação que fez begin() isso é teoricamente
      // impossível. se acontecer, alguém quebrou o contrato de uso e é
      // melhor a transação inteira morrer do que gravar resposta dupla.
      throw new ServiceUnavailableException({
        code: 'IDEMPOTENCY_COMPLETE_RACE',
        message: 'Tentativa de completar chave já finalizada',
      });
    }
  }

  // limpeza em lote com SKIP LOCKED: roda em vários nós sem briga
  // e sem segurar lock de chave que ainda está sendo consultada.
  async purgeExpired(batch = 500): Promise<number> {
    const result: Array<{ count: string }> = await this.dataSource.query(
      `WITH doomed AS (
         SELECT resource_id, idempotency_key FROM idempotency_keys
          WHERE expires_at < now() LIMIT $1 FOR UPDATE SKIP LOCKED)
       DELETE FROM idempotency_keys k USING doomed d
        WHERE k.resource_id = d.resource_id
          AND k.idempotency_key = d.idempotency_key
       RETURNING 1 AS count`,
      [batch],
    );
    return result.length;
  }

  private validateKey(key: string): void {
    if (!/^[A-Za-z0-9_\-:.]{16,128}$/.test(key)) {
      throw new ConflictException({
        code: 'IDEMPOTENCY_KEY_INVALID',
        message: 'Idempotency-Key deve ter 16-128 caracteres [A-Za-z0-9_-:.]',
      });
    }
  }
}
