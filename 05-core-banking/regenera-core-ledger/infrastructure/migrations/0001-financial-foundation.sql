-- =============================================================================
-- FUNDAÇÃO REAL
-- não é schema.
-- é sistema financeiro.
-- se quebrar, não tem retry que salva.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. CONTAS
-- =============================================================================
-- conta não é cadastro.
-- é fronteira de dinheiro.

CREATE TABLE ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code varchar(80) NOT NULL UNIQUE,

  account_class varchar(10) NOT NULL
    CHECK (account_class IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),

  owner_account_id uuid,

  currency char(3) NOT NULL DEFAULT 'BRL',

  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_owner ON ledger_accounts(owner_account_id);

-- =============================================================================
-- 2. ESTADO POR CONTA (TRAVA REAL)
-- =============================================================================
-- isso aqui não é cache.
-- é o que impede bifurcação de ledger.

CREATE TABLE ledger_account_state (
  account_id uuid PRIMARY KEY REFERENCES ledger_accounts(id),

  last_seq bigint NOT NULL DEFAULT 0,
  last_hash bytea NOT NULL,

  updated_at timestamptz NOT NULL DEFAULT now(),

  CHECK (octet_length(last_hash) = 32)
);

-- =============================================================================
-- 3. ENTRIES (INTENÇÃO)
-- =============================================================================

CREATE TABLE ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  reference_type varchar(40) NOT NULL,
  reference_id uuid NOT NULL,

  description varchar(200) NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (reference_type, reference_id)
);

-- =============================================================================
-- 4. LINES (DINHEIRO REAL)
-- =============================================================================
-- append-only.
-- não negocia.

CREATE TABLE ledger_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  entry_id uuid NOT NULL REFERENCES ledger_entries(id),

  account_id uuid NOT NULL REFERENCES ledger_accounts(id),

  direction varchar(6) NOT NULL
    CHECK (direction IN ('DEBIT','CREDIT')),

  amount bigint NOT NULL CHECK (amount > 0),

  currency char(3) NOT NULL DEFAULT 'BRL',

  seq bigint NOT NULL,

  prev_hash bytea NOT NULL,
  hash bytea NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CHECK (octet_length(prev_hash) = 32),
  CHECK (octet_length(hash) = 32)
);

CREATE INDEX idx_lines_account ON ledger_lines(account_id, seq);
CREATE INDEX idx_lines_entry ON ledger_lines(entry_id);

-- =============================================================================
-- 4.1 IMUTABILIDADE
-- =============================================================================

CREATE OR REPLACE FUNCTION forbid_line_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ledger é append-only: % proibido', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_update
BEFORE UPDATE OR DELETE ON ledger_lines
FOR EACH ROW EXECUTE FUNCTION forbid_line_mutation();

-- =============================================================================
-- 4.2 CHAIN + LOCK REAL
-- =============================================================================
-- aqui não é performance.
-- é integridade.

CREATE OR REPLACE FUNCTION before_insert_line()
RETURNS trigger AS $$
DECLARE
  st ledger_account_state%ROWTYPE;
BEGIN

  -- trava a conta inteira
  SELECT * INTO st
  FROM ledger_account_state
  WHERE account_id = NEW.account_id
  FOR UPDATE;

  IF st.account_id IS NULL THEN
    -- primeira linha da conta
    st.last_seq := 0;
    st.last_hash := digest('', 'sha256');

    INSERT INTO ledger_account_state(account_id, last_seq, last_hash)
    VALUES (NEW.account_id, 0, st.last_hash)
    ON CONFLICT DO NOTHING;

    SELECT * INTO st
    FROM ledger_account_state
    WHERE account_id = NEW.account_id
    FOR UPDATE;
  END IF;

  NEW.seq := st.last_seq + 1;
  NEW.prev_hash := st.last_hash;

  NEW.hash := digest(
    NEW.prev_hash ||
    convert_to(
      NEW.entry_id::text || '|' ||
      NEW.account_id::text || '|' ||
      NEW.direction || '|' ||
      NEW.amount::text || '|' ||
      NEW.seq::text,
      'UTF8'
    ),
    'sha256'
  );

  UPDATE ledger_account_state
  SET last_seq = NEW.seq,
      last_hash = NEW.hash,
      updated_at = now()
  WHERE account_id = NEW.account_id;

  RETURN NEW;

END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chain
BEFORE INSERT ON ledger_lines
FOR EACH ROW EXECUTE FUNCTION before_insert_line();

-- =============================================================================
-- 4.3 BALANCEAMENTO
-- =============================================================================
-- dinheiro não aceita erro.

CREATE OR REPLACE FUNCTION assert_balanced()
RETURNS trigger AS $$
DECLARE
  total bigint;
  cnt int;
BEGIN

  SELECT
    COALESCE(SUM(
      CASE WHEN direction='DEBIT' THEN amount ELSE -amount END
    ),0),
    COUNT(*)
  INTO total, cnt
  FROM ledger_lines
  WHERE entry_id = NEW.entry_id;

  IF cnt < 2 THEN
    RAISE EXCEPTION 'entry precisa >=2 linhas';
  END IF;

  IF total <> 0 THEN
    RAISE EXCEPTION 'entry desbalanceada: %', total;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_balance
AFTER INSERT ON ledger_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_balanced();

-- =============================================================================
-- 5. IDEMPOTÊNCIA (TRANSACIONAL)
-- =============================================================================
-- isso aqui não é cache.
-- é trava contra replay.

CREATE TABLE idempotency_keys (
  key varchar(128),
  scope varchar(80),

  request_hash bytea NOT NULL,

  response jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (scope, key)
);

-- =============================================================================
-- 6. OUTBOX (DÍVIDA)
-- =============================================================================

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  aggregate_id uuid NOT NULL,
  event_type varchar(80) NOT NULL,

  payload jsonb NOT NULL,

  correlation_id uuid NOT NULL,

  status varchar(10) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','DONE','FAILED')),

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (aggregate_id, event_type, correlation_id)
);

-- =============================================================================
-- 7. PIX (AMARRADO AO LEDGER)
-- =============================================================================

CREATE TABLE pix_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  sender_account_id uuid NOT NULL,

  amount bigint NOT NULL CHECK (amount > 0),

  idempotency_key varchar(128) NOT NULL UNIQUE,

  status varchar(12) NOT NULL
    CHECK (status IN (
      'CREATED','DEBITED','SETTLED','FAILED','REVERSED'
    )),

  ledger_entry_id uuid REFERENCES ledger_entries(id),

  created_at timestamptz DEFAULT now(),

  CHECK (
    status != 'DEBITED'
    OR ledger_entry_id IS NOT NULL
  )
);

COMMIT;
