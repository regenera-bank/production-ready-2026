import { readFileSync } from 'fs';
import { join } from 'path';

const V001 = readFileSync(
  join(__dirname, '../../db/migrations/V001__core_banking_foundation.sql'),
  'utf8',
);

describe('V001__core_banking_foundation.sql (PR-04a)', () => {
  it('define schema core_banking', () => {
    expect(V001).toMatch(/CREATE SCHEMA.*core_banking/i);
  });

  it('usa BIGINT para amount_minor — sem float', () => {
    expect(V001).toMatch(/amount_minor\s+BIGINT/i);
    expect(V001).not.toMatch(/amount_minor\s+(NUMERIC|DECIMAL|REAL|DOUBLE)/i);
  });

  it('declara ENUMs obrigatórios', () => {
    const enums = [
      'account_class',
      'account_status',
      'posting_side',
      'journal_status',
      'idempotency_state',
      'payment_status',
    ];
    for (const e of enums) {
      expect(V001).toContain(e);
    }
  });

  it('cria tabelas foundation', () => {
    const tables = [
      'ledger_accounts',
      'journal_entries',
      'ledger_postings',
      'idempotency_records',
      'payments',
      'holds',
      'outbox_events',
      'audit_events',
      'reconciliation_cases',
    ];
    for (const t of tables) {
      expect(V001).toMatch(new RegExp(`CREATE TABLE core_banking\\.${t}`, 'i'));
    }
  });

  it('outbox published_at nullable na criação', () => {
    expect(V001).toMatch(/published_at\s+TIMESTAMPTZ/i);
    expect(V001).not.toMatch(/published_at\s+TIMESTAMPTZ\s+NOT NULL/i);
  });

  it('Audit chain com previous_hash e event_hash', () => {
    expect(V001).toMatch(/previous_hash\s+TEXT\s+NOT NULL/i);
    expect(V001).toMatch(/event_hash\s+TEXT\s+NOT NULL/i);
  });

  it('instala 5 triggers (T1 draft, T2 balance, T3 journal+postings append, T4 Audit)', () => {
    expect(V001).toContain('trg_posting_draft_only');
    expect(V001).toContain('trg_journal_balance_on_post');
    expect(V001).toContain('trg_journal_append_only');
    expect(V001).toContain('trg_postings_append_only');
    expect(V001).toContain('trg_audit_append_only');
  });

  it('CHECK amount_minor > 0 em postings', () => {
    expect(V001).toMatch(/amount_minor\s*>\s*0/);
  });

  it('proíbe mutação em ledger_postings via trigger', () => {
    expect(V001).toMatch(/LEDGER_APPEND_ONLY.*ledger_postings/is);
  });
});