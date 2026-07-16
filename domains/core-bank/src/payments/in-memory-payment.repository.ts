import { Injectable } from '@nestjs/common';
import { PaymentRecord } from './payment.entity';
import { PaymentRepository } from './payment.repository';

@Injectable()
export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly payments = new Map<string, PaymentRecord>();

  async save(payment: PaymentRecord): Promise<PaymentRecord> {
    this.payments.set(payment.id, payment);
    return payment;
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    return this.payments.get(id) ?? null;
  }

  async findByIdempotencyKey(key: string): Promise<PaymentRecord | null> {
    return (
      [...this.payments.values()].find((p) => p.idempotencyKey === key) ?? null
    );
  }

  countPayments(): number {
    return this.payments.size;
  }

  clear(): void {
    this.payments.clear();
  }
}