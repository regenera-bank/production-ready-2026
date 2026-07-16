import { Injectable } from '@nestjs/common';
import { OutboxEventRecord } from './outbox.entity';
import { OutboxRepository } from './outbox.repository';

@Injectable()
export class InMemoryOutboxRepository implements OutboxRepository {
  private readonly events = new Map<string, OutboxEventRecord>();

  async append(event: OutboxEventRecord): Promise<OutboxEventRecord> {
    this.events.set(event.id, event);
    return event;
  }

  async findById(id: string): Promise<OutboxEventRecord | null> {
    return this.events.get(id) ?? null;
  }

  async findPending(limit: number): Promise<OutboxEventRecord[]> {
    const pending = [...this.events.values()]
      .filter((e) => e.publishedAt === null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return pending.slice(0, limit);
  }

  async updatePublishedAt(
    id: string,
    publishedAt: string,
  ): Promise<OutboxEventRecord> {
    const existing = this.events.get(id);
    if (!existing) {
      throw new Error(`outbox event not found: ${id}`);
    }
    const updated = { ...existing, publishedAt };
    this.events.set(id, updated);
    return updated;
  }

  clear(): void {
    this.events.clear();
  }
}