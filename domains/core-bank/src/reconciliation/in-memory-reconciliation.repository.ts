import { Injectable } from '@nestjs/common';
import { ReconciliationCaseRecord } from './reconciliation.entity';
import { ReconciliationRepository } from './reconciliation.repository';

@Injectable()
export class InMemoryReconciliationRepository implements ReconciliationRepository {
  private readonly cases = new Map<string, ReconciliationCaseRecord>();

  async save(reconciliationCase: ReconciliationCaseRecord): Promise<ReconciliationCaseRecord> {
    this.cases.set(reconciliationCase.id, reconciliationCase);
    return reconciliationCase;
  }

  async findById(id: string): Promise<ReconciliationCaseRecord | null> {
    return this.cases.get(id) ?? null;
  }

  async findOpenByPayment(paymentId: string): Promise<ReconciliationCaseRecord | null> {
    return (
      [...this.cases.values()].find(
        (c) => c.paymentId === paymentId && c.status === 'OPEN',
      ) ?? null
    );
  }

  clear(): void {
    this.cases.clear();
  }
}