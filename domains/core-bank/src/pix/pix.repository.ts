import { PixPaymentRecord } from './pix.entity';

export interface PixRepository {
  save(record: PixPaymentRecord): Promise<PixPaymentRecord>;
  findById(id: string): Promise<PixPaymentRecord | null>;
  findByEndToEndId(endToEndId: string): Promise<PixPaymentRecord | null>;
}