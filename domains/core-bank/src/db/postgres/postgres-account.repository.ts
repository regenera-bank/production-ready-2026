import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { LedgerAccount } from '../../accounts/account.entity';
import { AccountRepository } from '../../accounts/account.repository';
import { POSTGRES_POOL } from '../../storage/storage.tokens';
import { PgQueryable } from '../postgres-queryable';
import { mapAccountRow } from './postgres-row-mappers';

@Injectable()
export class PostgresAccountRepository implements AccountRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  private db(client?: PgQueryable): PgQueryable {
    return client ?? this.pool;
  }

  async save(account: LedgerAccount, client?: PgQueryable): Promise<LedgerAccount> {
    const db = this.db(client);
    const snapshot = account.toSnapshot();
    await db.query(
      `INSERT INTO core_banking.ledger_accounts (
         id, account_class, status, currency, external_reference,
         opened_at, closed_at, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         closed_at = EXCLUDED.closed_at,
         updated_at = NOW()`,
      [
        snapshot.id,
        snapshot.accountClass,
        snapshot.status,
        snapshot.currency,
        snapshot.externalReference,
        snapshot.openedAt,
        snapshot.closedAt,
      ],
    );
    return account;
  }

  async findById(id: string, client?: PgQueryable): Promise<LedgerAccount | null> {
    const row = await this.db(client).query(
      `SELECT id, account_class, status, currency, external_reference, opened_at, closed_at
       FROM core_banking.ledger_accounts WHERE id = $1`,
      [id],
    );
    if (row.rows.length === 0) return null;
    return mapAccountRow(row.rows[0]);
  }

  async findByExternalReference(
    reference: string,
    client?: PgQueryable,
  ): Promise<LedgerAccount | null> {
    const row = await this.db(client).query(
      `SELECT id, account_class, status, currency, external_reference, opened_at, closed_at
       FROM core_banking.ledger_accounts WHERE external_reference = $1`,
      [reference],
    );
    if (row.rows.length === 0) return null;
    return mapAccountRow(row.rows[0]);
  }
}