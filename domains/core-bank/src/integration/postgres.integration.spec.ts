/**
 * Postgres adapter integration tests — require DATABASE_URL.
 * Run: npm run test:postgres
 */
const POSTGRES_IT_ENABLED = Boolean(process.env.DATABASE_URL);

if (POSTGRES_IT_ENABLED) {
  process.env.CORE_BANK_STORAGE = 'postgres';
}

import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { Client, Pool } from 'pg';
import { AccountClass } from '../accounts/account.entity';
import { AccountRegistryService } from '../accounts/account-registry.service';
import { CoreBankModule } from '../core-bank.module';
import { CoreBankService } from '../core-bank.service';
import {
  closePostgresPool,
  createPostgresPool,
  resetPostgresPoolForTests,
} from '../db/postgres-pool';
import {
  isMigrationApplied,
  resetCoreBankingSchema,
  runMigrations,
} from '../db/migration-runner';
import { PostgresLedgerRepository } from '../db/postgres/postgres-ledger.repository';
import { PostgresUnitOfWork } from '../db/postgres-unit-of-work';
import { ConflictException } from '../errors/core-banking.errors';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { JournalStatus, PostingSide } from '../ledger/ledger.entity';
import { LedgerService } from '../ledger/ledger.service';
import { Money } from '../money/money.value-object';
import { OutboxService } from '../outbox/outbox.service';
import { PaymentStatus } from '../payments/payment.entity';
import { ReconciliationResolution } from '../reconciliation/reconciliation.entity';
import { POSTGRES_POOL } from '../storage/storage.tokens';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://localhost:5432/regenera_core_test';

async function ensureTestDatabase(): Promise<void> {
  const parsed = new URL(DATABASE_URL);
  const dbName = parsed.pathname.replace(/^\//, '');
  parsed.pathname = '/postgres';
  const admin = new Client({ connectionString: parsed.toString() });
  await admin.connect();
  try {
    const exists = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.end();
  }
}

const describePostgres = POSTGRES_IT_ENABLED ? describe : describe.skip;

describePostgres('Postgres adapter integration', () => {
  let pool: Pool;
  let moduleRef: TestingModule;
  let core: CoreBankService;

  beforeAll(async () => {
    process.env.DATABASE_URL = DATABASE_URL;
    resetPostgresPoolForTests();
    await ensureTestDatabase();
    pool = createPostgresPool();
    await resetCoreBankingSchema(pool);
    await runMigrations(pool);

    moduleRef = await Test.createTestingModule({
      imports: [CoreBankModule.forRoot('postgres')],
    }).compile();
    await moduleRef.init();
    core = moduleRef.get(CoreBankService);
  }, 60_000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
    await closePostgresPool();
  });

  beforeEach(async () => {
    await pool.query(`
      TRUNCATE TABLE
        core_banking.pix_payments,
        core_banking.reconciliation_cases,
        core_banking.audit_events,
        core_banking.outbox_events,
        core_banking.holds,
        core_banking.payments,
        core_banking.ledger_postings,
        core_banking.journal_entries,
        core_banking.idempotency_records,
        core_banking.ledger_accounts
      RESTART IDENTITY CASCADE
    `);
  });

  it('applies V001 and V002 on empty database', async () => {
    const tables = await pool.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'core_banking'
         AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
    );
    expect(tables.rows.map((r) => r.table_name)).toEqual(
      expect.arrayContaining([
        'audit_events',
        'holds',
        'idempotency_records',
        'journal_entries',
        'ledger_accounts',
        'ledger_postings',
        'outbox_events',
        'payments',
        'pix_payments',
        'reconciliation_cases',
        'schema_migrations',
      ]),
    );

    const views = await pool.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.views
       WHERE table_schema = 'core_banking'`,
    );
    expect(views.rows.map((r) => r.table_name)).toEqual(
      expect.arrayContaining([
        'account_signed_balances',
        'available_balances',
        'unresolved_financial_states',
      ]),
    );
  });

  it('safe reapply skips already applied migrations', async () => {
    expect(await isMigrationApplied(pool, 'V001')).toBe(true);
    expect(await isMigrationApplied(pool, 'V002')).toBe(true);

    const secondRun = await runMigrations(pool);
    expect(secondRun.filter((r) => r.version === 'V001')[0]).toMatchObject({
      applied: false,
      skipped: true,
    });
    expect(secondRun.filter((r) => r.version === 'V002')[0]).toMatchObject({
      applied: false,
      skipped: true,
    });
  });

  it('creates ledger accounts in Postgres', async () => {
    const account = await core.accounts.open({
      accountClass: AccountClass.LIABILITY,
      externalReference: 'customer-001',
    });

    const row = await pool.query(
      'SELECT id, account_class, status FROM core_banking.ledger_accounts WHERE id = $1',
      [account.id],
    );
    expect(row.rows[0]).toMatchObject({
      id: account.id,
      account_class: 'LIABILITY',
      status: 'OPEN',
    });
  });

  it('posts balanced journal entry via DRAFT → postings → POSTED', async () => {
    const cash = await core.accounts.open({ accountClass: AccountClass.ASSET });
    const liability = await core.accounts.open({
      accountClass: AccountClass.LIABILITY,
    });

    const entry = await core.ledger.post({
      correlationId: randomUUID(),
      postings: [
        {
          ledgerAccountId: cash.id,
          accountClass: AccountClass.ASSET,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(5_000),
        },
        {
          ledgerAccountId: liability.id,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(5_000),
        },
      ],
    });

    expect(entry.status).toBe(JournalStatus.POSTED);

    const journal = await pool.query(
      'SELECT status, posted_at FROM core_banking.journal_entries WHERE id = $1',
      [entry.id],
    );
    expect(journal.rows[0].status).toBe('POSTED');
    expect(journal.rows[0].posted_at).not.toBeNull();

    const postings = await pool.query(
      'SELECT COUNT(*)::int AS count FROM core_banking.ledger_postings WHERE journal_entry_id = $1',
      [entry.id],
    );
    expect(postings.rows[0].count).toBe(2);
  });

  it('rolls back uncommitted transaction — no durable writes', async () => {
    const uow = new PostgresUnitOfWork(pool);
    const accountRepo = moduleRef.get(AccountRegistryService);
    const accountId = randomUUID();

    await uow.runInRollback(async (client) => {
      await client.query(
        `INSERT INTO core_banking.ledger_accounts (
           id, account_class, status, currency, opened_at, created_at, updated_at
         ) VALUES ($1, 'LIABILITY', 'OPEN', 'BRL', NOW(), NOW(), NOW())`,
        [accountId],
      );
    });

    const persisted = await accountRepo.getById(accountId);
    expect(persisted).toBeNull();
  });

  it('replays idempotent payment create with same key', async () => {
    const debtor = await core.accounts.open({ accountClass: AccountClass.LIABILITY });
    const creditor = await core.accounts.open({
      accountClass: AccountClass.LIABILITY,
    });
    const cash = await core.accounts.open({ accountClass: AccountClass.ASSET });

    await core.ledger.post({
      correlationId: randomUUID(),
      postings: [
        {
          ledgerAccountId: cash.id,
          accountClass: AccountClass.ASSET,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(10_000),
        },
        {
          ledgerAccountId: debtor.id,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(10_000),
        },
      ],
    });

    const key = `pay-${randomUUID()}`;
    const command = {
      debtorAccountId: debtor.id,
      creditorAccountId: creditor.id,
      amount: Money.fromCents(1_000),
      idempotencyKey: key,
      correlationId: randomUUID(),
    };

    const first = await core.payments.create(command);
    const second = await core.payments.create(command);

    expect(second.id).toBe(first.id);

    const count = await pool.query(
      'SELECT COUNT(*)::int AS count FROM core_banking.payments WHERE idempotency_key = $1',
      [key],
    );
    expect(count.rows[0].count).toBe(1);
  });

  it('handles concurrent idempotency begins — single winner', async () => {
    const idempotency = moduleRef.get(IdempotencyService);
    const key = `idem-${randomUUID()}`;
    const payload = { amountCents: '100', debtorAccountId: randomUUID() };

    const results = await Promise.all(
      Array.from({ length: 8 }, () => idempotency.begin(key, payload)),
    );

    const acquired = results.filter((r) => r.action === 'ACQUIRED');
    const blocked = results.filter((r) => r.action === 'BLOCKED');

    expect(acquired.length).toBeGreaterThanOrEqual(1);
    expect(acquired.length + blocked.length).toBe(8);

    const rows = await pool.query(
      'SELECT COUNT(*)::int AS count FROM core_banking.idempotency_records WHERE idempotency_key = $1',
      [key],
    );
    expect(rows.rows[0].count).toBe(1);
  });

  it('rejects payment with insufficient available balance', async () => {
    const debtor = await core.accounts.open({ accountClass: AccountClass.LIABILITY });
    const creditor = await core.accounts.open({
      accountClass: AccountClass.LIABILITY,
    });

    await expect(
      core.payments.create({
        debtorAccountId: debtor.id,
        creditorAccountId: creditor.id,
        amount: Money.fromCents(100),
        idempotencyKey: `insufficient-${randomUUID()}`,
        correlationId: randomUUID(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('persists outbox events and marks published', async () => {
    const outbox = moduleRef.get(OutboxService);
    const event = await outbox.append({
      aggregateType: 'Payment',
      aggregateId: randomUUID(),
      eventType: 'PaymentCreated',
      payload: { amountCents: '500' },
    });

    const pending = await outbox.pending(10);
    expect(pending.some((e: { id: string }) => e.id === event.id)).toBe(true);

    const publishedAt = new Date().toISOString();
    await outbox.markPublished(event.id, publishedAt);

    const row = await pool.query(
      'SELECT published_at FROM core_banking.outbox_events WHERE id = $1',
      [event.id],
    );
    expect(row.rows[0].published_at).not.toBeNull();
  });

  it('runs reconciliation flow for UNKNOWN payment', async () => {
    const debtor = await core.accounts.open({ accountClass: AccountClass.LIABILITY });
    const creditor = await core.accounts.open({
      accountClass: AccountClass.LIABILITY,
    });
    const cash = await core.accounts.open({ accountClass: AccountClass.ASSET });

    await core.ledger.post({
      correlationId: randomUUID(),
      postings: [
        {
          ledgerAccountId: cash.id,
          accountClass: AccountClass.ASSET,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(10_000),
        },
        {
          ledgerAccountId: debtor.id,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(10_000),
        },
      ],
    });

    const payment = await core.payments.create({
      debtorAccountId: debtor.id,
      creditorAccountId: creditor.id,
      amount: Money.fromCents(2_000),
      idempotencyKey: `recon-${randomUUID()}`,
      correlationId: randomUUID(),
    });

    await core.payments.markSent(payment.id);
    const unknown = await core.payments.markUnknown(payment.id);
    expect(unknown.status).toBe(PaymentStatus.UNKNOWN);

    await core.reconciliation.open(payment.id, 'maker-1', 'evidence-001');
    const reconciled = await core.reconciliation.resolve({
      paymentId: payment.id,
      resolution: ReconciliationResolution.SETTLED,
      evidenceRef: 'evidence-001',
      makerId: 'maker-1',
      checkerId: 'checker-2',
    });

    expect(reconciled.status).toBe(PaymentStatus.RECONCILED);
    expect(reconciled.journalEntryId).not.toBeNull();

    const caseRow = await pool.query(
      `SELECT status FROM core_banking.reconciliation_cases WHERE payment_id = $1`,
      [payment.id],
    );
    expect(caseRow.rows.some((r) => r.status === 'SETTLED')).toBe(true);
  });

  it('simulates restart — data survives pool recycle', async () => {
    const account = await core.accounts.open({
      accountClass: AccountClass.LIABILITY,
      externalReference: `restart-${randomUUID()}`,
    });

    await moduleRef.close();
    await closePostgresPool();
    resetPostgresPoolForTests();

    const restartedPool = createPostgresPool();
    const restartedModule = await Test.createTestingModule({
      imports: [CoreBankModule.forRoot('postgres')],
    }).compile();
    await restartedModule.init();

    const restartedAccounts = restartedModule.get(AccountRegistryService);
    const loaded = await restartedAccounts.getById(account.id);
    expect(loaded?.id).toBe(account.id);

    await restartedModule.close();
    await restartedPool.end();

    moduleRef = await Test.createTestingModule({
      imports: [CoreBankModule.forRoot('postgres')],
    }).compile();
    await moduleRef.init();
    core = moduleRef.get(CoreBankService);
    pool = moduleRef.get<Pool>(POSTGRES_POOL);
  });

  it('rejects imbalanced journal at DB trigger (constraint violation)', async () => {
    const cash = await core.accounts.open({ accountClass: AccountClass.ASSET });
    const liability = await core.accounts.open({
      accountClass: AccountClass.LIABILITY,
    });

    const ledgerRepo = moduleRef.get(PostgresLedgerRepository);
    const entryId = randomUUID();
    const createdAt = new Date().toISOString();
    const entryHash = LedgerService.computeEntryHash({
      id: entryId,
      correlationId: randomUUID(),
      idempotencyKey: null,
      reversalOf: null,
      postings: [
        {
          ledgerAccountId: cash.id,
          accountClass: AccountClass.ASSET,
          side: PostingSide.DEBIT,
          amount: Money.fromCents(1_000),
        },
        {
          ledgerAccountId: liability.id,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: Money.fromCents(500),
        },
      ],
    });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ledgerRepo.saveDraftOnly(
        {
          id: entryId,
          status: JournalStatus.DRAFT,
          idempotencyKey: null,
          entryHash,
          reversalOf: null,
          correlationId: randomUUID(),
          createdAt,
          postedAt: null,
          postings: [
            {
              id: randomUUID(),
              journalEntryId: entryId,
              ledgerAccountId: cash.id,
              accountClass: AccountClass.ASSET,
              side: PostingSide.DEBIT,
              amount: Money.fromCents(1_000),
            },
            {
              id: randomUUID(),
              journalEntryId: entryId,
              ledgerAccountId: liability.id,
              accountClass: AccountClass.LIABILITY,
              side: PostingSide.CREDIT,
              amount: Money.fromCents(500),
            },
          ],
        },
        client,
      );

      await expect(
        client.query(
          `UPDATE core_banking.journal_entries SET status = 'POSTED' WHERE id = $1`,
          [entryId],
        ),
      ).rejects.toThrow(/LEDGER_IMBALANCE/);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    const count = await pool.query(
      'SELECT COUNT(*)::int AS count FROM core_banking.journal_entries WHERE id = $1',
      [entryId],
    );
    expect(count.rows[0].count).toBe(0);
  });

  it('enforces referential integrity on ledger postings', async () => {
    const journalId = randomUUID();
    await pool.query(
      `INSERT INTO core_banking.journal_entries (
         id, status, entry_hash, correlation_id
       ) VALUES ($1, 'DRAFT', 'hash', $2)`,
      [journalId, randomUUID()],
    );

    await expect(
      pool.query(
        `INSERT INTO core_banking.ledger_postings (
           id, journal_entry_id, ledger_account_id, side, amount_minor
         ) VALUES ($1, $2, $3, 'DEBIT', 100)`,
        [randomUUID(), journalId, randomUUID()],
      ),
    ).rejects.toThrow();
  });

  it('manifest reports postgres persistence', () => {
    expect(core.getManifest().persistence).toBe('postgres');
  });
});