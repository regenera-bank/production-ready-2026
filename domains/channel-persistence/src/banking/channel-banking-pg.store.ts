import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import type { BankingSnapshot, PixDirectoryRecord, PixKeyRecord } from './channel-banking.types';
import { emptyBankingSnapshot } from './channel-banking.types';

const hashPixKey = (keyType: string, normalized: string): string =>
  createHash('sha256').update(`${keyType}:${normalized}`).digest('hex');

export class ChannelBankingPgStore {
  constructor(private readonly pool: Pool) {}

  async loadSnapshot(): Promise<BankingSnapshot> {
    const snapshot = emptyBankingSnapshot();

    const ownership = await this.pool.query<{
      external_ref: string;
      ledger_account_id: string;
    }>(
      `SELECT c.external_ref, ao.ledger_account_id
       FROM channel_experience.account_ownership ao
       JOIN channel_experience.customers c ON c.id = ao.customer_id
       WHERE ao.status = 'ACTIVE'`,
    );
    for (const row of ownership.rows) {
      snapshot.accountsByUser[row.external_ref] = row.ledger_account_id;
    }

    const pixKeys = await this.pool.query<{
      external_ref: string;
      id: string;
      key_type: string;
      display_mask: string;
      created_at: Date;
    }>(
      `SELECT c.external_ref, pk.id, pk.key_type, pk.display_mask, pk.created_at
       FROM channel_experience.pix_keys pk
       JOIN channel_experience.customers c ON c.id = pk.customer_id
       WHERE pk.active = true`,
    );
    for (const row of pixKeys.rows) {
      const list = snapshot.pixKeysByUser[row.external_ref] ?? [];
      list.push({
        id: row.id,
        type: row.key_type,
        key: row.display_mask,
        createdAt: row.created_at.toLocaleDateString('pt-BR'),
      });
      snapshot.pixKeysByUser[row.external_ref] = list;
    }

    const directory = await this.pool.query<{
      key_type: string;
      key_value_hash: string;
      external_ref: string;
      ledger_account_id: string;
      display_name: string;
    }>(
      `SELECT d.key_type, d.key_value_hash, c.external_ref, d.ledger_account_id, d.display_name
       FROM channel_experience.pix_directory_entries d
       JOIN channel_experience.customers c ON c.id = d.customer_id`,
    );
    for (const row of directory.rows) {
      snapshot.pixDirectory[row.key_value_hash] = {
        userId: row.external_ref,
        displayName: row.display_name,
        accountId: row.ledger_account_id,
        keyType: row.key_type,
        rawKey: row.key_type,
      };
    }

    return snapshot;
  }

  async upsertAccountOwnership(
    userId: string,
    ledgerAccountId: string,
    correlationId: string,
  ): Promise<void> {
    const customerId = await this.ensureCustomerId(userId);
    await this.pool.query(
      `INSERT INTO channel_experience.account_ownership
         (customer_id, ledger_account_id, status, opened_at, correlation_id)
       VALUES ($1, $2, 'ACTIVE', now(), $3)
       ON CONFLICT (customer_id, ledger_account_id)
       DO UPDATE SET status = 'ACTIVE', opened_at = COALESCE(channel_experience.account_ownership.opened_at, now())`,
      [customerId, ledgerAccountId, correlationId],
    );
  }

  async registerPixKey(
    userId: string,
    ledgerAccountId: string,
    keyType: string,
    normalized: string,
    displayMask: string,
    displayName: string,
    rawKey: string,
  ): Promise<PixKeyRecord> {
    const customerId = await this.ensureCustomerId(userId);
    const keyHash = hashPixKey(keyType, normalized);
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO channel_experience.pix_keys
         (id, customer_id, ledger_account_id, key_type, key_value_hash, display_mask)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (key_type, key_value_hash) DO NOTHING`,
      [id, customerId, ledgerAccountId, keyType, keyHash, displayMask],
    );
    await this.pool.query(
      `INSERT INTO channel_experience.pix_directory_entries
         (key_type, key_value_hash, customer_id, ledger_account_id, display_name, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (key_type, key_value_hash)
       DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now()`,
      [keyType, keyHash, customerId, ledgerAccountId, displayName],
    );
    return {
      id,
      type: keyType,
      key: displayMask,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };
  }

  async pixDirectoryHas(keyType: string, normalized: string): Promise<boolean> {
    const keyHash = hashPixKey(keyType, normalized);
    const res = await this.pool.query(
      `SELECT 1 FROM channel_experience.pix_directory_entries WHERE key_value_hash = $1 LIMIT 1`,
      [keyHash],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async getDirectoryEntry(
    keyType: string,
    normalized: string,
  ): Promise<PixDirectoryRecord | null> {
    const keyHash = hashPixKey(keyType, normalized);
    const res = await this.pool.query<{
      external_ref: string;
      ledger_account_id: string;
      display_name: string;
      key_type: string;
    }>(
      `SELECT c.external_ref, d.ledger_account_id, d.display_name, d.key_type
       FROM channel_experience.pix_directory_entries d
       JOIN channel_experience.customers c ON c.id = d.customer_id
       WHERE d.key_value_hash = $1`,
      [keyHash],
    );
    const row = res.rows[0];
    if (!row) {
      return null;
    }
    return {
      userId: row.external_ref,
      displayName: row.display_name,
      accountId: row.ledger_account_id,
      keyType: row.key_type,
      rawKey: normalized,
    };
  }

  async updateDisplayNameForUser(userId: string, displayName: string): Promise<void> {
    const customerId = await this.ensureCustomerId(userId);
    await this.pool.query(
      `UPDATE channel_experience.pix_directory_entries
       SET display_name = $2, updated_at = now()
       WHERE customer_id = $1`,
      [customerId, displayName],
    );
  }

  async clearUserBankingState(userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      const customerId = await this.findCustomerId(userId);
      if (!customerId) {
        continue;
      }
      await this.pool.query(
        `DELETE FROM channel_experience.account_ownership WHERE customer_id = $1`,
        [customerId],
      );
      await this.pool.query(`DELETE FROM channel_experience.pix_keys WHERE customer_id = $1`, [
        customerId,
      ]);
      await this.pool.query(
        `DELETE FROM channel_experience.pix_directory_entries WHERE customer_id = $1`,
        [customerId],
      );
    }
  }

  private async findCustomerId(externalRef: string): Promise<string | null> {
    const res = await this.pool.query<{ id: string }>(
      `SELECT id FROM channel_experience.customers WHERE external_ref = $1`,
      [externalRef],
    );
    return res.rows[0]?.id ?? null;
  }

  async findUserIdByLedgerAccount(
    ledgerAccountId: string,
  ): Promise<string | undefined> {
    const res = await this.pool.query<{ external_ref: string }>(
      `SELECT c.external_ref
       FROM channel_experience.account_ownership ao
       JOIN channel_experience.customers c ON c.id = ao.customer_id
       WHERE ao.ledger_account_id = $1
       LIMIT 1`,
      [ledgerAccountId],
    );
    return res.rows[0]?.external_ref;
  }

  private async ensureCustomerId(externalRef: string): Promise<string> {
    const existing = await this.findCustomerId(externalRef);
    if (existing) {
      return existing;
    }
    const res = await this.pool.query<{ id: string }>(
      `INSERT INTO channel_experience.customers
         (external_ref, document_hash, display_name, email, phone, birth_date)
       VALUES ($1, $2, $3, $4, $5, '2000-01-01')
       ON CONFLICT (external_ref) DO UPDATE SET updated_at = now()
       RETURNING id`,
      [
        externalRef,
        createHash('sha256').update(externalRef).digest('hex'),
        'Cliente',
        `${externalRef}@homolog.local`,
        '00000000000',
      ],
    );
    return res.rows[0].id;
  }
}