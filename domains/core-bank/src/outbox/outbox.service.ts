import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  AppendOutboxEventInput,
  OutboxEventRecord,
} from './outbox.entity';
import { OutboxRepository } from './outbox.repository';
import { NotFoundException, ValidationException } from '../errors/core-banking.errors';

@Injectable()
export class OutboxService {
  constructor(private readonly repository: OutboxRepository) {}

  async append(input: AppendOutboxEventInput): Promise<OutboxEventRecord> {
    const event: OutboxEventRecord = {
      id: randomUUID(),
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      eventType: input.eventType,
      payload: input.payload,
      publishedAt: null,
      createdAt: new Date().toISOString(),
    };
    return this.repository.append(event);
  }

  async pending(limit: number): Promise<OutboxEventRecord[]> {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new ValidationException(
        'pending exige limite inteiro positivo',
        'OUTBOX_PENDING_INVALID_LIMIT',
        { limit },
      );
    }
    return this.repository.findPending(limit);
  }

  async markPublished(id: string, publishedAt?: string): Promise<OutboxEventRecord> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        'Evento outbox não encontrado',
        'OUTBOX_NOT_FOUND',
        { id },
      );
    }

    // Idempotente: segunda chamada retorna o mesmo carimbo, não sobrescreve.
    if (existing.publishedAt !== null) {
      return existing;
    }

    const stamp = publishedAt ?? new Date().toISOString();
    return this.repository.updatePublishedAt(id, stamp);
  }
}