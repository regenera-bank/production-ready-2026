-- V002 — Views operacionais
-- Regenera Bank | domains/core-bank
-- Saldo derivado do razão (Regra 7) — nunca coluna mutável em conta.
-- Requer V001 aplicado.

BEGIN;

-- ── Saldos assinados por conta (somente journals POSTED) ─────────────────────
-- ASSET/EXPENSE: naturalmente débito → débitos menos créditos.
-- LIABILITY/EQUITY/REVENUE: naturalmente crédito → créditos menos débitos.

CREATE OR REPLACE VIEW core_banking.account_signed_balances AS
SELECT
  la.id AS ledger_account_id,
  la.account_class,
  la.status AS account_status,
  la.currency,
  COALESCE(bal.signed_balance_minor, 0::BIGINT) AS signed_balance_minor
FROM core_banking.ledger_accounts la
LEFT JOIN (
  SELECT
    lp.ledger_account_id,
    SUM(
      CASE
        WHEN la2.account_class IN ('ASSET', 'EXPENSE') THEN
          CASE WHEN lp.side = 'DEBIT' THEN lp.amount_minor ELSE -lp.amount_minor END
        ELSE
          CASE WHEN lp.side = 'CREDIT' THEN lp.amount_minor ELSE -lp.amount_minor END
      END
    ) AS signed_balance_minor
  FROM core_banking.ledger_postings lp
  INNER JOIN core_banking.journal_entries je
    ON je.id = lp.journal_entry_id
   AND je.status = 'POSTED'
  INNER JOIN core_banking.ledger_accounts la2
    ON la2.id = lp.ledger_account_id
  GROUP BY lp.ledger_account_id
) bal ON bal.ledger_account_id = la.id;

-- ── Saldo disponível = assinado − holds ativos não expirados ─────────────────

CREATE OR REPLACE VIEW core_banking.available_balances AS
SELECT
  sb.ledger_account_id,
  sb.account_class,
  sb.account_status,
  sb.currency,
  sb.signed_balance_minor,
  COALESCE(h.active_holds_minor, 0::BIGINT) AS active_holds_minor,
  sb.signed_balance_minor - COALESCE(h.active_holds_minor, 0::BIGINT) AS available_balance_minor
FROM core_banking.account_signed_balances sb
LEFT JOIN (
  SELECT
    ledger_account_id,
    SUM(amount_minor) AS active_holds_minor
  FROM core_banking.holds
  WHERE status = 'ACTIVE'
    AND (expires_at IS NULL OR expires_at > NOW())
  GROUP BY ledger_account_id
) h ON h.ledger_account_id = sb.ledger_account_id;

-- ── Estados financeiros não resolvidos (operações + reconciliação) ───────────
-- UNKNOWN sagrado (ADR-003): aparece aqui até reconciliação com evidência.

CREATE OR REPLACE VIEW core_banking.unresolved_financial_states AS
SELECT
  'PAYMENT'::TEXT AS entity_type,
  p.id::TEXT AS entity_id,
  p.correlation_id,
  p.status::TEXT AS detail_status,
  'PAYMENT_UNKNOWN'::TEXT AS blocking_code,
  p.updated_at AS observed_at
FROM core_banking.payments p
WHERE p.status = 'UNKNOWN'

UNION ALL

SELECT
  'IDEMPOTENCY'::TEXT,
  ir.idempotency_key,
  NULL::UUID,
  ir.state::TEXT,
  'IDEMPOTENCY_UNKNOWN'::TEXT,
  ir.updated_at
FROM core_banking.idempotency_records ir
WHERE ir.state = 'UNKNOWN'

UNION ALL

SELECT
  'RECONCILIATION'::TEXT,
  rc.id::TEXT,
  p.correlation_id,
  rc.status::TEXT,
  'RECONCILIATION_OPEN'::TEXT,
  rc.created_at
FROM core_banking.reconciliation_cases rc
INNER JOIN core_banking.payments p ON p.id = rc.payment_id
WHERE rc.status = 'OPEN';

COMMIT;