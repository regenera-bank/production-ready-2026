-- V001 — Core Banking foundation
-- Regenera Bank | domains/core-bank
-- Regras: BIGINT para dinheiro, append-only no razão, D=C ao postar.
-- ADR-001, ADR-002, ADR-003 | DESIGN-CORE-BANKING-001

BEGIN;

CREATE SCHEMA IF NOT EXISTS core_banking;

-- ── ENUMs ────────────────────────────────────────────────────────────────────

CREATE TYPE core_banking.account_class AS ENUM (
  'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
);

CREATE TYPE core_banking.account_status AS ENUM (
  'OPEN', 'BLOCKED', 'CLOSED'
);

CREATE TYPE core_banking.posting_side AS ENUM (
  'DEBIT', 'CREDIT'
);

CREATE TYPE core_banking.journal_status AS ENUM (
  'DRAFT', 'POSTED', 'REVERSED'
);

CREATE TYPE core_banking.idempotency_state AS ENUM (
  'PROCESSING', 'COMPLETED', 'UNKNOWN', 'FAILED_RETRYABLE', 'FAILED_FINAL'
);

CREATE TYPE core_banking.payment_status AS ENUM (
  'CREATED', 'AUTHORIZED', 'SENT', 'SETTLED', 'UNKNOWN', 'FAILED', 'RECONCILED'
);

CREATE TYPE core_banking.hold_status AS ENUM (
  'ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED'
);

CREATE TYPE core_banking.reconciliation_status AS ENUM (
  'OPEN', 'SETTLED', 'REJECTED'
);

-- ── Contas do razão ──────────────────────────────────────────────────────────

CREATE TABLE core_banking.ledger_accounts (
  id                 UUID PRIMARY KEY,
  account_class      core_banking.account_class NOT NULL,
  status             core_banking.account_status NOT NULL DEFAULT 'OPEN',
  currency           CHAR(3) NOT NULL DEFAULT 'BRL',
  external_reference TEXT,
  opened_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ledger_accounts_external_reference_unique UNIQUE (external_reference),
  CONSTRAINT ledger_accounts_currency_brl CHECK (currency = 'BRL')
);

CREATE INDEX idx_ledger_accounts_status ON core_banking.ledger_accounts (status);

-- ── Idempotência ──────────────────────────────────────────────────────────────

CREATE TABLE core_banking.idempotency_records (
  idempotency_key    TEXT PRIMARY KEY,
  payload_hash       TEXT NOT NULL,
  state              core_banking.idempotency_state NOT NULL,
  response_reference TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_idempotency_state ON core_banking.idempotency_records (state);

-- ── Ledger (append-only) ─────────────────────────────────────────────────────

CREATE TABLE core_banking.journal_entries (
  id               UUID PRIMARY KEY,
  status           core_banking.journal_status NOT NULL DEFAULT 'DRAFT',
  idempotency_key  TEXT,
  entry_hash       TEXT NOT NULL,
  reversal_of      UUID REFERENCES core_banking.journal_entries (id),
  correlation_id   UUID NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posted_at        TIMESTAMPTZ,
  CONSTRAINT journal_entries_idempotency_unique UNIQUE (idempotency_key)
);

CREATE INDEX idx_journal_entries_status ON core_banking.journal_entries (status);
CREATE INDEX idx_journal_entries_reversal_of ON core_banking.journal_entries (reversal_of);

CREATE TABLE core_banking.ledger_postings (
  id                UUID PRIMARY KEY,
  journal_entry_id  UUID NOT NULL REFERENCES core_banking.journal_entries (id),
  ledger_account_id UUID NOT NULL REFERENCES core_banking.ledger_accounts (id),
  side              core_banking.posting_side NOT NULL,
  amount_minor      BIGINT NOT NULL,
  currency          CHAR(3) NOT NULL DEFAULT 'BRL',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ledger_postings_amount_positive CHECK (amount_minor > 0),
  CONSTRAINT ledger_postings_currency_brl CHECK (currency = 'BRL')
);

CREATE INDEX idx_ledger_postings_journal ON core_banking.ledger_postings (journal_entry_id);
CREATE INDEX idx_ledger_postings_account ON core_banking.ledger_postings (ledger_account_id);

-- ── Pagamentos ───────────────────────────────────────────────────────────────

CREATE TABLE core_banking.payments (
  id                  UUID PRIMARY KEY,
  status              core_banking.payment_status NOT NULL DEFAULT 'CREATED',
  debtor_account_id   UUID NOT NULL REFERENCES core_banking.ledger_accounts (id),
  creditor_account_id UUID NOT NULL REFERENCES core_banking.ledger_accounts (id),
  amount_minor        BIGINT NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'BRL',
  idempotency_key     TEXT NOT NULL,
  correlation_id      UUID NOT NULL,
  journal_entry_id    UUID REFERENCES core_banking.journal_entries (id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_amount_positive CHECK (amount_minor > 0),
  CONSTRAINT payments_currency_brl CHECK (currency = 'BRL'),
  CONSTRAINT payments_idempotency_unique UNIQUE (idempotency_key)
);

CREATE INDEX idx_payments_status ON core_banking.payments (status);

-- ── Holds ────────────────────────────────────────────────────────────────────

CREATE TABLE core_banking.holds (
  id                UUID PRIMARY KEY,
  ledger_account_id UUID NOT NULL REFERENCES core_banking.ledger_accounts (id),
  amount_minor      BIGINT NOT NULL,
  currency          CHAR(3) NOT NULL DEFAULT 'BRL',
  status            core_banking.hold_status NOT NULL DEFAULT 'ACTIVE',
  payment_id        UUID REFERENCES core_banking.payments (id),
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at       TIMESTAMPTZ,
  CONSTRAINT holds_amount_positive CHECK (amount_minor > 0),
  CONSTRAINT holds_currency_brl CHECK (currency = 'BRL')
);

CREATE INDEX idx_holds_account_active ON core_banking.holds (ledger_account_id)
  WHERE status = 'ACTIVE';

-- ── Outbox ───────────────────────────────────────────────────────────────────

CREATE TABLE core_banking.outbox_events (
  id             UUID PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id   UUID NOT NULL,
  event_type     TEXT NOT NULL,
  payload        JSONB NOT NULL,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_pending ON core_banking.outbox_events (created_at)
  WHERE published_at IS NULL;

-- ── Audit chain ──────────────────────────────────────────────────────────────

CREATE TABLE core_banking.audit_events (
  id            BIGSERIAL PRIMARY KEY,
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  previous_hash TEXT NOT NULL,
  event_hash    TEXT NOT NULL,
  correlation_id UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_created ON core_banking.audit_events (created_at);

-- ── Reconciliação (UNKNOWN → SETTLED|REJECTED) ─────────────────────────────

CREATE TABLE core_banking.reconciliation_cases (
  id            UUID PRIMARY KEY,
  payment_id    UUID NOT NULL REFERENCES core_banking.payments (id),
  status        core_banking.reconciliation_status NOT NULL DEFAULT 'OPEN',
  evidence_ref  TEXT NOT NULL,
  maker_id      TEXT NOT NULL,
  checker_id    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ,
  CONSTRAINT reconciliation_one_open_per_payment UNIQUE (payment_id, status)
);

-- ── Funções de trigger ───────────────────────────────────────────────────────

-- T1: posting só em journal DRAFT
CREATE OR REPLACE FUNCTION core_banking.trg_posting_draft_only_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  journal_status core_banking.journal_status;
BEGIN
  SELECT status INTO journal_status
  FROM core_banking.journal_entries
  WHERE id = NEW.journal_entry_id;

  IF journal_status IS DISTINCT FROM 'DRAFT' THEN
    RAISE EXCEPTION 'LEDGER_POSTING_NOT_DRAFT: posting só permitido em journal DRAFT';
  END IF;

  RETURN NEW;
END;
$$;

-- T2: DRAFT→POSTED exige D=C, moeda única, valor > 0
CREATE OR REPLACE FUNCTION core_banking.trg_journal_balance_on_post_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  debit_sum  BIGINT;
  credit_sum BIGINT;
  currencies INT;
  line_count BIGINT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'DRAFT' AND NEW.status = 'POSTED' THEN
    SELECT
      COALESCE(SUM(amount_minor) FILTER (WHERE side = 'DEBIT'), 0),
      COALESCE(SUM(amount_minor) FILTER (WHERE side = 'CREDIT'), 0),
      COUNT(DISTINCT currency),
      COUNT(*)
    INTO debit_sum, credit_sum, currencies, line_count
    FROM core_banking.ledger_postings
    WHERE journal_entry_id = NEW.id;

    IF line_count = 0 THEN
      RAISE EXCEPTION 'LEDGER_EMPTY_ENTRY: lançamento sem partidas';
    END IF;

    IF debit_sum = 0 OR credit_sum = 0 THEN
      RAISE EXCEPTION 'LEDGER_ZERO_LINE: linha com valor zero';
    END IF;

    IF currencies > 1 THEN
      RAISE EXCEPTION 'LEDGER_MIXED_CURRENCY: moedas misturadas';
    END IF;

    IF debit_sum <> credit_sum THEN
      RAISE EXCEPTION 'LEDGER_IMBALANCE: débitos % ≠ créditos %', debit_sum, credit_sum;
    END IF;

    NEW.posted_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- T3a: journal append-only — único UPDATE permitido: DRAFT→POSTED sem mutar evidência
CREATE OR REPLACE FUNCTION core_banking.trg_journal_append_only_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'LEDGER_APPEND_ONLY: DELETE proibido em journal_entries';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'DRAFT'
       AND NEW.status = 'POSTED'
       AND NEW.id = OLD.id
       AND NEW.entry_hash = OLD.entry_hash
       AND NEW.idempotency_key IS NOT DISTINCT FROM OLD.idempotency_key
       AND NEW.reversal_of IS NOT DISTINCT FROM OLD.reversal_of
       AND NEW.correlation_id = OLD.correlation_id
       AND NEW.created_at = OLD.created_at THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'LEDGER_APPEND_ONLY: UPDATE proibido em journal_entries';
  END IF;

  RETURN NEW;
END;
$$;

-- T3b: postings append-only — sem UPDATE/DELETE
CREATE OR REPLACE FUNCTION core_banking.trg_postings_append_only_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'LEDGER_APPEND_ONLY: mutação proibida em ledger_postings';
END;
$$;

-- T4: audit append-only
CREATE OR REPLACE FUNCTION core_banking.trg_audit_append_only_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_APPEND_ONLY: mutação proibida em audit_events';
END;
$$;

-- ── Triggers ─────────────────────────────────────────────────────────────────

CREATE TRIGGER trg_posting_draft_only
  BEFORE INSERT ON core_banking.ledger_postings
  FOR EACH ROW EXECUTE FUNCTION core_banking.trg_posting_draft_only_fn();

CREATE TRIGGER trg_journal_balance_on_post
  BEFORE UPDATE OF status ON core_banking.journal_entries
  FOR EACH ROW EXECUTE FUNCTION core_banking.trg_journal_balance_on_post_fn();

CREATE TRIGGER trg_journal_append_only
  BEFORE UPDATE OR DELETE ON core_banking.journal_entries
  FOR EACH ROW EXECUTE FUNCTION core_banking.trg_journal_append_only_fn();

CREATE TRIGGER trg_postings_append_only
  BEFORE UPDATE OR DELETE ON core_banking.ledger_postings
  FOR EACH ROW EXECUTE FUNCTION core_banking.trg_postings_append_only_fn();

CREATE TRIGGER trg_audit_append_only
  BEFORE UPDATE OR DELETE ON core_banking.audit_events
  FOR EACH ROW EXECUTE FUNCTION core_banking.trg_audit_append_only_fn();

COMMIT;