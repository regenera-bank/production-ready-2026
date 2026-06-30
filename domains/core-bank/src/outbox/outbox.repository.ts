import { OutboxEventRecord } from './outbox.entity';

export interface OutboxRepository {
  append(event: OutboxEventRecord): Promise<OutboxEventRecord>;
  findById(id: string): Promise<OutboxEventRecord | null>;
  findPending(limit: number): Promise<OutboxEventRecord[]>;
  updatePublishedAt(id: string, publishedAt: string): Promise<OutboxEventRecord>;
}