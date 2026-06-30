import { DomainEvent } from '../domain-event.interface';

export interface InvestmentOrderExecutedPayload {
  orderId: string;
  accountId: string;
  assetId: string;
  quantity: number;
  totalValue: number;
}

export type InvestmentOrderExecutedEvent =
  DomainEvent<InvestmentOrderExecutedPayload>;
