import { Injectable } from '@nestjs/common';
import {
  PaymentSettledOutboxEvent,
  TransactionProjectionService,
} from '@regenera/channel-persistence';

/**
 * Publica eventos payment.settled para o projector.
 * Em homolog/test aplicação é síncrona em transaction_projections (memória).
 * Em produção o worker transaction-projector consome o outbox do core.
 */
@Injectable()
export class PaymentSettlementPublisher {
  constructor(
    private readonly projections: TransactionProjectionService,
  ) {}

  async publishSettled(event: PaymentSettledOutboxEvent): Promise<void> {
    await this.projections.applyOutboxEvent(event);
  }
}