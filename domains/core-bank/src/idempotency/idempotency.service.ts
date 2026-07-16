import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  IdempotencyBeginResult,
  IdempotencyRecord,
  IdempotencyState,
} from './idempotency.entity';
import { IdempotencyRepository } from './idempotency.repository';
import { ConflictException, StateTransitionException } from '../errors/core-banking.errors';

@Injectable()
export class IdempotencyService {
  constructor(private readonly repository: IdempotencyRepository) {}

  static payloadHash(payload: object): string {
    const keys = Object.keys(payload).sort();
    const canonical = JSON.stringify(payload, keys);
    return createHash('sha256').update(canonical, 'utf8').digest('hex');
  }

  async begin(
    idempotencyKey: string,
    payload: object,
  ): Promise<IdempotencyBeginResult> {
    const hash = IdempotencyService.payloadHash(payload);
    const existing = await this.repository.findByKey(idempotencyKey);

    if (!existing) {
      const created = await this.createProcessing(idempotencyKey, hash);
      return { action: 'ACQUIRED', record: created };
    }

    if (existing.payloadHash !== hash) {
      throw new ConflictException(
        'Mesma chave com payload diferente',
        'IDEMPOTENCY_PAYLOAD_DRIFT',
        { idempotencyKey, expectedHash: existing.payloadHash, receivedHash: hash },
      );
    }

    switch (existing.state) {
      case IdempotencyState.COMPLETED:
        return {
          action: 'REPLAY',
          record: existing,
          responseReference: existing.responseReference!,
        };

      case IdempotencyState.UNKNOWN:
        return { action: 'BLOCKED', record: existing, reason: 'UNKNOWN' };

      case IdempotencyState.PROCESSING:
        return { action: 'BLOCKED', record: existing, reason: 'PROCESSING' };

      case IdempotencyState.FAILED_FINAL:
        return { action: 'BLOCKED', record: existing, reason: 'FAILED_FINAL' };

      case IdempotencyState.FAILED_RETRYABLE: {
        const acquired = await this.transition(existing, IdempotencyState.PROCESSING);
        return { action: 'ACQUIRED', record: acquired };
      }

      default: {
        const _exhaustive: never = existing.state;
        return _exhaustive;
      }
    }
  }

  async complete(
    idempotencyKey: string,
    responseReference: string,
  ): Promise<IdempotencyRecord> {
    const record = await this.requireKey(idempotencyKey);
    if (record.state !== IdempotencyState.PROCESSING) {
      throw new StateTransitionException(
        'complete só a partir de PROCESSING',
        'IDEMPOTENCY_INVALID_COMPLETE',
        { idempotencyKey, state: record.state },
      );
    }
    return this.transition(record, IdempotencyState.COMPLETED, responseReference);
  }

  async markUnknown(idempotencyKey: string): Promise<IdempotencyRecord> {
    const record = await this.requireKey(idempotencyKey);
    if (record.state !== IdempotencyState.PROCESSING) {
      throw new StateTransitionException(
        'UNKNOWN só a partir de PROCESSING',
        'IDEMPOTENCY_INVALID_UNKNOWN',
        { idempotencyKey, state: record.state },
      );
    }
    return this.transition(record, IdempotencyState.UNKNOWN);
  }

  // Timeout após envio: create já completou, mas liquidação externa ficou incerta.
  // Mesma chave deixa de ser replay e passa a exigir reconciliação.
  async markPaymentUnknown(idempotencyKey: string): Promise<IdempotencyRecord> {
    const record = await this.requireKey(idempotencyKey);
    if (record.state !== IdempotencyState.COMPLETED) {
      throw new StateTransitionException(
        'markPaymentUnknown exige COMPLETED',
        'IDEMPOTENCY_INVALID_PAYMENT_UNKNOWN',
        { idempotencyKey, state: record.state },
      );
    }
    return this.transition(record, IdempotencyState.UNKNOWN);
  }

  async failRetryable(idempotencyKey: string): Promise<IdempotencyRecord> {
    const record = await this.requireKey(idempotencyKey);
    if (record.state !== IdempotencyState.PROCESSING) {
      throw new StateTransitionException(
        'failRetryable só a partir de PROCESSING',
        'IDEMPOTENCY_INVALID_FAIL_RETRYABLE',
        { idempotencyKey, state: record.state },
      );
    }
    return this.transition(record, IdempotencyState.FAILED_RETRYABLE);
  }

  async failFinal(idempotencyKey: string): Promise<IdempotencyRecord> {
    const record = await this.requireKey(idempotencyKey);
    if (record.state !== IdempotencyState.PROCESSING) {
      throw new StateTransitionException(
        'failFinal só a partir de PROCESSING',
        'IDEMPOTENCY_INVALID_FAIL_FINAL',
        { idempotencyKey, state: record.state },
      );
    }
    return this.transition(record, IdempotencyState.FAILED_FINAL);
  }

  private async createProcessing(
    idempotencyKey: string,
    payloadHash: string,
  ): Promise<IdempotencyRecord> {
    const now = new Date().toISOString();
    return this.repository.save({
      idempotencyKey,
      payloadHash,
      state: IdempotencyState.PROCESSING,
      responseReference: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  private async transition(
    record: IdempotencyRecord,
    state: IdempotencyState,
    responseReference?: string,
  ): Promise<IdempotencyRecord> {
    return this.repository.save({
      ...record,
      state,
      responseReference: responseReference ?? record.responseReference,
      updatedAt: new Date().toISOString(),
    });
  }

  private async requireKey(idempotencyKey: string): Promise<IdempotencyRecord> {
    const record = await this.repository.findByKey(idempotencyKey);
    if (!record) {
      throw new ConflictException(
        'Chave de idempotência inexistente',
        'IDEMPOTENCY_NOT_FOUND',
        { idempotencyKey },
      );
    }
    return record;
  }
}