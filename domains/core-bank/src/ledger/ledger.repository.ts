import { JournalEntryRecord } from './ledger.entity';

export interface LedgerRepository {
  save(entry: JournalEntryRecord): Promise<JournalEntryRecord>;
  findById(id: string): Promise<JournalEntryRecord | null>;
  findByIdempotencyKey(key: string): Promise<JournalEntryRecord | null>;
  findByReversalOf(originalId: string): Promise<JournalEntryRecord | null>;
  findPosted(): Promise<JournalEntryRecord[]>;
}