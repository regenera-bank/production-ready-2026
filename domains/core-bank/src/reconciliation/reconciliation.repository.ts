import { ReconciliationCaseRecord } from './reconciliation.entity';

export interface ReconciliationRepository {
  save(reconciliationCase: ReconciliationCaseRecord): Promise<ReconciliationCaseRecord>;
  findById(id: string): Promise<ReconciliationCaseRecord | null>;
  findOpenByPayment(paymentId: string): Promise<ReconciliationCaseRecord | null>;
}