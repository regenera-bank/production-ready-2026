import { readFileSync } from 'fs';
import { join } from 'path';

const V002 = readFileSync(
  join(__dirname, '../../db/migrations/V002__operational_views.sql'),
  'utf8',
);

describe('V002__operational_views.sql (PR-04b)', () => {
  it('cria view account_signed_balances', () => {
    expect(V002).toMatch(
      /CREATE OR REPLACE VIEW core_banking\.account_signed_balances/i,
    );
  });

  it('signed balance projeta apenas journals POSTED', () => {
    expect(V002).toMatch(/je\.status\s*=\s*'POSTED'/i);
  });

  it('diferencia saldo por account_class (ASSET vs LIABILITY)', () => {
    expect(V002).toMatch(/ASSET.*EXPENSE/is);
    expect(V002).toMatch(/LIABILITY|EQUITY|REVENUE/);
  });

  it('cria view available_balances', () => {
    expect(V002).toMatch(
      /CREATE OR REPLACE VIEW core_banking\.available_balances/i,
    );
  });

  it('available = signed − holds ACTIVE não expirados', () => {
    expect(V002).toMatch(/active_holds_minor/i);
    expect(V002).toMatch(/status\s*=\s*'ACTIVE'/i);
    expect(V002).toMatch(/available_balance_minor/i);
    expect(V002).toMatch(/signed_balance_minor\s*-/);
  });

  it('cria view unresolved_financial_states', () => {
    expect(V002).toMatch(
      /CREATE OR REPLACE VIEW core_banking\.unresolved_financial_states/i,
    );
  });

  it('inclui payments UNKNOWN', () => {
    expect(V002).toMatch(/payments p/i);
    expect(V002).toMatch(/p\.status\s*=\s*'UNKNOWN'/i);
  });

  it('inclui idempotency UNKNOWN', () => {
    expect(V002).toMatch(/idempotency_records/i);
    expect(V002).toMatch(/ir\.state\s*=\s*'UNKNOWN'/i);
  });

  it('inclui reconciliation OPEN', () => {
    expect(V002).toMatch(/reconciliation_cases/i);
    expect(V002).toMatch(/rc\.status\s*=\s*'OPEN'/i);
  });

  it('não usa float/numeric para saldo', () => {
    expect(V002).not.toMatch(/NUMERIC|DECIMAL|REAL|DOUBLE PRECISION/i);
    expect(V002).toMatch(/BIGINT/i);
  });
});