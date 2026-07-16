// Outbox transacional — evento nasce sem publishedAt; relay marca depois.
// publishedAt preenchido na criação quebraria idempotência do relay.

export interface OutboxEventRecord {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  publishedAt: string | null;
  createdAt: string;
}

export interface AppendOutboxEventInput {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
}