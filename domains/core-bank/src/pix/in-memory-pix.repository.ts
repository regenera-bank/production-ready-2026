import { Injectable } from '@nestjs/common';
import { PixPaymentRecord } from './pix.entity';
import { PixRepository } from './pix.repository';

@Injectable()
export class InMemoryPixRepository implements PixRepository {
  private readonly records = new Map<string, PixPaymentRecord>();

  async save(record: PixPaymentRecord): Promise<PixPaymentRecord> {
    this.records.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<PixPaymentRecord | null> {
    return this.records.get(id) ?? null;
  }

  async findByPaymentId(paymentId: string): Promise<PixPaymentRecord | null> {
    return (
      [...this.records.values()].find((r) => r.paymentId === paymentId) ?? null
    );
  }

  async findByEndToEndId(endToEndId: string): Promise<PixPaymentRecord | null> {
    return (
      [...this.records.values()].find((r) => r.endToEndId === endToEndId) ?? null
    );
  }

  clear(): void {
    this.records.clear();
  }
}