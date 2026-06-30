import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  AUDIT_GENESIS_HASH,
  AppendAuditEventInput,
  AuditEventRecord,
} from './audit-chain.entity';
import { AuditChainRepository } from './audit-chain.repository';
import { ValidationException } from '../errors/core-banking.errors';

export interface AuditVerifyResult {
  valid: boolean;
  eventsChecked: number;
  firstInvalidId?: number;
  reason?: string;
}

@Injectable()
export class AuditChainService {
  constructor(private readonly repository: AuditChainRepository) {}

  static canonicalPayload(payload: Record<string, unknown>): string {
    const keys = Object.keys(payload).sort();
    return JSON.stringify(payload, keys);
  }

  static computeEventHash(params: {
    previousHash: string;
    eventType: string;
    payload: Record<string, unknown>;
    correlationId: string | null;
    createdAt: string;
  }): string {
    const body = JSON.stringify({
      correlationId: params.correlationId,
      createdAt: params.createdAt,
      eventType: params.eventType,
      payload: JSON.parse(AuditChainService.canonicalPayload(params.payload)),
      previousHash: params.previousHash,
    });
    return createHash('sha256').update(body, 'utf8').digest('hex');
  }

  async append(input: AppendAuditEventInput): Promise<AuditEventRecord> {
    const last = await this.repository.findLast();
    const previousHash = last?.eventHash ?? AUDIT_GENESIS_HASH;
    const createdAt = new Date().toISOString();
    const correlationId = input.correlationId ?? null;

    const eventHash = AuditChainService.computeEventHash({
      previousHash,
      eventType: input.eventType,
      payload: input.payload,
      correlationId,
      createdAt,
    });

    return this.repository.append({
      eventType: input.eventType,
      payload: input.payload,
      previousHash,
      eventHash,
      correlationId,
      createdAt,
    });
  }

  async verify(): Promise<AuditVerifyResult> {
    const events = await this.repository.findAllOrdered();
    let expectedPrevious = AUDIT_GENESIS_HASH;

    for (const event of events) {
      if (event.previousHash !== expectedPrevious) {
        return {
          valid: false,
          eventsChecked: events.indexOf(event) + 1,
          firstInvalidId: event.id,
          reason: 'previous_hash rompido na cadeia',
        };
      }

      const recomputed = AuditChainService.computeEventHash({
        previousHash: event.previousHash,
        eventType: event.eventType,
        payload: event.payload,
        correlationId: event.correlationId,
        createdAt: event.createdAt,
      });

      if (recomputed !== event.eventHash) {
        return {
          valid: false,
          eventsChecked: events.indexOf(event) + 1,
          firstInvalidId: event.id,
          reason: 'payload ou metadados adulterados',
        };
      }

      expectedPrevious = event.eventHash;
    }

    return { valid: true, eventsChecked: events.length };
  }

  async verifyOrThrow(): Promise<void> {
    const result = await this.verify();
    if (!result.valid) {
      throw new ValidationException(
        result.reason ?? 'Cadeia de auditoria inválida',
        'AUDIT_CHAIN_TAMPERED',
        {
          firstInvalidId: result.firstInvalidId,
          eventsChecked: result.eventsChecked,
        },
      );
    }
  }
}