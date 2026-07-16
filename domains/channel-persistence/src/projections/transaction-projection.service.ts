import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { TransactionProjectionRepository } from './transaction-projection.repository';
import { TransactionProjectionPgStore } from './transaction-projection-pg.store';
import type {
  PaymentSettledOutboxEvent,
  TransactionProjectionRecord,
} from './transaction-projection.types';

export interface ProjectedTransactionView {
  readonly id: string;
  readonly title: string;
  readonly party: string;
  readonly date: string;
  readonly amountCents: string;
  readonly type: 'inflow' | 'outflow';
  readonly channel: 'pix' | 'transfer' | 'seed' | 'card' | 'investments';
  readonly icon: string;
  readonly category:
    | 'lifestyle'
    | 'essential'
    | 'transport'
    | 'leisure'
    | 'investment';
}

@Injectable()
export class TransactionProjectionService implements OnModuleInit {
  private readonly logger = new Logger(TransactionProjectionService.name);
  private readonly memoryRepo = new TransactionProjectionRepository();
  private readonly pgStore?: TransactionProjectionPgStore;

  constructor(@Optional() pool?: Pool) {
    if (pool) {
      this.pgStore = new TransactionProjectionPgStore(pool);
    }
  }

  onModuleInit(): void {
    this.logger.log(
      this.pgStore
        ? 'transaction_projections: PostgreSQL (fase 3 — worker projector_outbox)'
        : 'transaction_projections: backend memória (homologação/teste)',
    );
  }

  reset(): void {
    this.memoryRepo.reset();
  }

  has(customerId: string, paymentId: string): boolean {
    return this.memoryRepo.has(customerId, paymentId);
  }

  listByCustomer(customerId: string): ProjectedTransactionView[] {
    return this.memoryRepo.listByCustomer(customerId).map((row) => this.toView(row));
  }

  async listByCustomerAsync(customerId: string): Promise<ProjectedTransactionView[]> {
    if (this.pgStore) {
      const rows = await this.pgStore.listByCustomer(customerId);
      if (rows.length > 0) {
        return rows.map((row) => this.toView(row));
      }
    }
    return this.listByCustomer(customerId);
  }

  async applyOutboxEvent(
    event: PaymentSettledOutboxEvent,
  ): Promise<TransactionProjectionRecord | null> {
    const cents = BigInt(event.amountCents);
    if (cents <= 0n) {
      return null;
    }
    const input = {
      customerId: event.customerId,
      paymentId: event.paymentId,
      transactionId: event.transactionId,
      correlationId: event.correlationId,
      idempotencyKey: event.idempotencyKey,
      direction: event.direction,
      amountCents: cents,
      title: event.title,
      party: event.party,
      channel: event.channel,
      paymentState: 'SETTLED' as const,
      occurredAt: event.occurredAt,
      icon: event.icon,
      category: event.category,
    };

    const memoryRecord = this.memoryRepo.apply(input);
    if (this.pgStore && memoryRecord) {
      try {
        await this.pgStore.enqueueOutbox('payment.settled', event);
        await this.pgStore.apply(input);
      } catch (err) {
        this.logger.warn(
          `PG projection falhou: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    return memoryRecord;
  }

  private toView(row: TransactionProjectionRecord): ProjectedTransactionView {
    const signed =
      row.direction === 'outflow'
        ? (-row.amountCents).toString()
        : row.amountCents.toString();
    return {
      id: row.transactionId,
      title: row.title,
      party: row.party,
      date: row.occurredAt,
      amountCents: signed,
      type: row.direction,
      channel: row.channel as ProjectedTransactionView['channel'],
      icon: row.icon,
      category: row.category as ProjectedTransactionView['category'],
    };
  }
}