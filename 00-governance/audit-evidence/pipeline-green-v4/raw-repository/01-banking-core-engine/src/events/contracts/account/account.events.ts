import { DomainEvent } from '../domain-event.interface';

export interface AccountCreatedPayload {
  accountId: string;
  neuralId: string;
  currency: string;
}

export type AccountCreatedEvent = DomainEvent<AccountCreatedPayload>;
