export interface DomainEvent<T = any> {
  eventId: string;
  occurredAt: Date;
  tenantId: string;
  version: number;
  source: string;
  payload: T;
}
