import { OutboxEventSnapshot, OutboxStore } from './outbox-store';

/** Store em memória — apenas com CORE_BANK_STORAGE=memory (testes) */
export class InMemoryOutboxStore implements OutboxStore {
  private readonly events = new Map<string, OutboxEventSnapshot>();

  seed(event: OutboxEventSnapshot): void {
    this.events.set(event.id, event);
  }

  async findById(id: string): Promise<OutboxEventSnapshot | null> {
    return this.events.get(id) ?? null;
  }

  async markPublished(
    id: string,
    publishedAt?: string,
  ): Promise<OutboxEventSnapshot> {
    const existing = this.events.get(id);
    if (!existing) {
      throw new Error(`outbox event not found: ${id}`);
    }

    if (existing.publishedAt !== null) {
      return existing;
    }

    const updated: OutboxEventSnapshot = {
      ...existing,
      publishedAt: publishedAt ?? new Date().toISOString(),
    };
    this.events.set(id, updated);
    return updated;
  }

  clear(): void {
    this.events.clear();
  }
}