import { Injectable } from '@nestjs/common';
import { JournalEntryRecord } from './ledger.entity';
import { LedgerRepository } from './ledger.repository';

@Injectable()
export class InMemoryLedgerRepository implements LedgerRepository {
  private readonly entries = new Map<string, JournalEntryRecord>();

  async save(entry: JournalEntryRecord): Promise<JournalEntryRecord> {
    this.entries.set(entry.id, entry);
    return entry;
  }

  async findById(id: string): Promise<JournalEntryRecord | null> {
    return this.entries.get(id) ?? null;
  }

  async findByIdempotencyKey(key: string): Promise<JournalEntryRecord | null> {
    return (
      [...this.entries.values()].find((e) => e.idempotencyKey === key) ?? null
    );
  }

  async findByReversalOf(originalId: string): Promise<JournalEntryRecord | null> {
    return (
      [...this.entries.values()].find((e) => e.reversalOf === originalId) ?? null
    );
  }

  async findPosted(): Promise<JournalEntryRecord[]> {
    return [...this.entries.values()].filter((e) => e.status === 'POSTED');
  }

  clear(): void {
    this.entries.clear();
  }
}