import { PaymentRecord } from './payment.entity';

export interface PaymentRepository {
  save(payment: PaymentRecord): Promise<PaymentRecord>;
  findById(id: string): Promise<PaymentRecord | null>;
  findByIdempotencyKey(key: string): Promise<PaymentRecord | null>;
}