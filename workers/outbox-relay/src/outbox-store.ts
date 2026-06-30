/** Abstração da tabela outbox_events — worker marca published_at após relay */
export interface OutboxEventSnapshot {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  publishedAt: string | null;
  createdAt: string;
}

export interface OutboxStore {
  findById(id: string): Promise<OutboxEventSnapshot | null>;
  markPublished(id: string, publishedAt?: string): Promise<OutboxEventSnapshot>;
}