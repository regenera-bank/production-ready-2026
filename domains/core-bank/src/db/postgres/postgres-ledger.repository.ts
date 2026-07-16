import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import {
  JournalEntryRecord,
  JournalStatus,
} from '../../ledger/ledger.entity';
import { LedgerRepository } from '../../ledger/ledger.repository';
import { POSTGRES_POOL } from '../../storage/storage.tokens';
import { PgQueryable } from '../postgres-queryable';
import { mapJournalRow, mapPostingRow } from './postgres-row-mappers';

@Injectable()
export class PostgresLedgerRepository implements LedgerRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async save(entry: JournalEntryRecord): Promise<JournalEntryRecord> {
    const existing = await this.findById(entry.id);
    if (existing) {
      return existing;
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO core_banking.journal_entries (
           id, status, idempotency_key, entry_hash, reversal_of, correlation_id, created_at
         ) VALUES ($1, 'DRAFT', $2, $3, $4, $5, $6)`,
        [
          entry.id,
          entry.idempotencyKey,
          entry.entryHash,
          entry.reversalOf,
          entry.correlationId,
          entry.createdAt,
        ],
      );

      for (const posting of entry.postings) {
        await client.query(
          `INSERT INTO core_banking.ledger_postings (
             id, journal_entry_id, ledger_account_id, side, amount_minor, currency, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            posting.id,
            posting.journalEntryId,
            posting.ledgerAccountId,
            posting.side,
            posting.amount.toCentsString(),
            posting.amount.currency,
            entry.createdAt,
          ],
        );
      }

      const posted = await client.query<{ posted_at: Date }>(
        `UPDATE core_banking.journal_entries
         SET status = 'POSTED'
         WHERE id = $1
         RETURNING posted_at`,
        [entry.id],
      );

      await client.query('COMMIT');

      return {
        ...entry,
        status: JournalStatus.POSTED,
        postedAt: posted.rows[0]!.posted_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<JournalEntryRecord | null> {
    return this.loadJournal(this.pool, 'je.id = $1', [id]);
  }

  async findByIdempotencyKey(key: string): Promise<JournalEntryRecord | null> {
    return this.loadJournal(this.pool, 'je.idempotency_key = $1', [key]);
  }

  async findByReversalOf(originalId: string): Promise<JournalEntryRecord | null> {
    return this.loadJournal(this.pool, 'je.reversal_of = $1', [originalId]);
  }

  async findPosted(): Promise<JournalEntryRecord[]> {
    const journals = await this.pool.query(
      `SELECT je.id, je.status, je.idempotency_key, je.entry_hash, je.reversal_of,
              je.correlation_id, je.created_at, je.posted_at
       FROM core_banking.journal_entries je
       WHERE je.status = 'POSTED'
       ORDER BY je.created_at ASC`,
    );

    const results: JournalEntryRecord[] = [];
    for (const row of journals.rows) {
      const postings = await this.loadPostings(this.pool, row.id);
      results.push(mapJournalRow(row, postings));
    }
    return results;
  }

  async saveDraftOnly(
    entry: JournalEntryRecord,
    client: PoolClient,
  ): Promise<void> {
    await client.query(
      `INSERT INTO core_banking.journal_entries (
         id, status, idempotency_key, entry_hash, reversal_of, correlation_id, created_at
       ) VALUES ($1, 'DRAFT', $2, $3, $4, $5, $6)`,
      [
        entry.id,
        entry.idempotencyKey,
        entry.entryHash,
        entry.reversalOf,
        entry.correlationId,
        entry.createdAt,
      ],
    );

    for (const posting of entry.postings) {
      await client.query(
        `INSERT INTO core_banking.ledger_postings (
           id, journal_entry_id, ledger_account_id, side, amount_minor, currency, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          posting.id,
          posting.journalEntryId,
          posting.ledgerAccountId,
          posting.side,
          posting.amount.toCentsString(),
          posting.amount.currency,
          entry.createdAt,
        ],
      );
    }
  }

  private async loadJournal(
    db: PgQueryable,
    whereClause: string,
    params: unknown[],
  ): Promise<JournalEntryRecord | null> {
    const result = await db.query(
      `SELECT je.id, je.status, je.idempotency_key, je.entry_hash, je.reversal_of,
              je.correlation_id, je.created_at, je.posted_at
       FROM core_banking.journal_entries je
       WHERE ${whereClause}`,
      params,
    );
    if (result.rows.length === 0) return null;
    const postings = await this.loadPostings(db, result.rows[0].id);
    return mapJournalRow(result.rows[0], postings);
  }

  private async loadPostings(db: PgQueryable, journalEntryId: string) {
    const result = await db.query(
      `SELECT lp.id, lp.journal_entry_id, lp.ledger_account_id, la.account_class,
              lp.side, lp.amount_minor, lp.currency
       FROM core_banking.ledger_postings lp
       INNER JOIN core_banking.ledger_accounts la ON la.id = lp.ledger_account_id
       WHERE lp.journal_entry_id = $1
       ORDER BY lp.created_at ASC`,
      [journalEntryId],
    );
    return result.rows.map(mapPostingRow);
  }
}