import { Injectable } from '@nestjs/common';
import { IdempotencyRecord } from './idempotency.entity';
import { IdempotencyRepository } from './idempotency.repository';

@Injectable()
export class InMemoryIdempotencyRepository implements IdempotencyRepository {
  private readonly records = new Map<string, IdempotencyRecord>();

  async findByKey(key: string): Promise<IdempotencyRecord | null> {
    return this.records.get(key) ?? null;
  }

  async save(record: IdempotencyRecord): Promise<IdempotencyRecord> {
    this.records.set(record.idempotencyKey, record);
    return record;
  }

  clear(): void {
    this.records.clear();
  }
}