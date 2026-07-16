-- V001 — Persistência multicanal (substitui homolog-store.json na jornada crítica)
-- Schema: channel_experience
-- Dinheiro: BIGINT centavos. Documentos: metadados aqui; blob em object storage privado.
-- ADR pendente: CHANNEL-PERSISTENCE-001

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS channel_experience;

-- ── ENUMs ────────────────────────────────────────────────────────────────────

CREATE TYPE channel_experience.journey_state AS ENUM (
  'DRAFT',
  'PERSONAL_DATA_PENDING',
  'DOCUMENTS_PENDING',
  'DOCUMENTS_PROCESSING',
  'SELFIE_PENDING',
  'LIVENESS_PROCESSING',
  'KYC_PROCESSING',
  'MANUAL_REVIEW',
  'APPROVED',
  'ACCOUNT_CREATING',
  'AUTHENTICATOR_PENDING',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE channel_experience.payment_channel_state AS ENUM (
  'CREATED',
  'RECIPIENT_RESOLVED',
  'AWAITING_CONFIRMATION',
  'AWAITING_STEP_UP',
  'AUTHORIZED',
  'PROCESSING',
  'SETTLED',
  'REJECTED',
  'FAILED',
  'REVERSED'
);

CREATE TYPE channel_experience.document_analysis_status AS ENUM (
  'UPLOADED',
  'SCANNING',
  'APPROVED',
  'REJECTED',
  'EXPIRED'
);

CREATE TYPE channel_experience.channel_kind AS ENUM (
  'WEB', 'ANDROID', 'IOS', 'DESKTOP', 'PWA'
);

-- ── customers & credentials ──────────────────────────────────────────────────

CREATE TABLE channel_experience.customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref    TEXT NOT NULL UNIQUE,
  document_hash   TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  birth_date      DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE channel_experience.customer_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  credential_type TEXT NOT NULL CHECK (credential_type IN ('password_hash', 'passkey', 'firebase_uid')),
  credential_ref  TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ,
  UNIQUE (customer_id, credential_type, credential_ref)
);

-- ── devices & sessions ───────────────────────────────────────────────────────

CREATE TABLE channel_experience.devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  device_fingerprint TEXT NOT NULL,
  channel         channel_experience.channel_kind NOT NULL,
  platform_version TEXT,
  app_version     TEXT,
  trusted         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, device_fingerprint)
);

CREATE TABLE channel_experience.sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  device_id       UUID REFERENCES channel_experience.devices(id),
  access_token_hash TEXT NOT NULL UNIQUE,
  refresh_token_hash TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  correlation_id  TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_customer_active
  ON channel_experience.sessions (customer_id)
  WHERE revoked_at IS NULL;

-- ── onboarding journeys & transitions (append-only transitions) ───────────────

CREATE TABLE channel_experience.onboarding_journeys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id      TEXT NOT NULL UNIQUE,
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  device_id       UUID REFERENCES channel_experience.devices(id),
  channel         channel_experience.channel_kind NOT NULL,
  current_state   channel_experience.journey_state NOT NULL DEFAULT 'DRAFT',
  version         BIGINT NOT NULL DEFAULT 1 CHECK (version >= 1),
  correlation_id  TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE channel_experience.onboarding_transitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id      TEXT NOT NULL REFERENCES channel_experience.onboarding_journeys(journey_id),
  previous_state  channel_experience.journey_state NOT NULL,
  new_state       channel_experience.journey_state NOT NULL,
  command         TEXT NOT NULL,
  actor           TEXT NOT NULL,
  channel         channel_experience.channel_kind NOT NULL,
  device_id       UUID REFERENCES channel_experience.devices(id),
  correlation_id  TEXT NOT NULL,
  version         BIGINT NOT NULL CHECK (version >= 1),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_transitions_journey
  ON channel_experience.onboarding_transitions (journey_id, created_at);

-- ── document assets (sem Base64 — blob em object storage) ───────────────────

CREATE TABLE channel_experience.document_assets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES channel_experience.customers(id),
  journey_id          TEXT REFERENCES channel_experience.onboarding_journeys(journey_id),
  asset_kind          TEXT NOT NULL CHECK (asset_kind IN ('RG', 'CNH', 'SELFIE', 'LIVENESS', 'OTHER')),
  storage_bucket      TEXT NOT NULL,
  storage_key         TEXT NOT NULL,
  content_type        TEXT NOT NULL,
  size_bytes          BIGINT NOT NULL CHECK (size_bytes > 0),
  sha256              TEXT NOT NULL,
  encryption_key_id   TEXT NOT NULL,
  analysis_status     channel_experience.document_analysis_status NOT NULL DEFAULT 'UPLOADED',
  retention_until     TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (storage_bucket, storage_key)
);

CREATE TABLE channel_experience.kyc_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  journey_id      TEXT NOT NULL REFERENCES channel_experience.onboarding_journeys(journey_id),
  provider        TEXT NOT NULL,
  status          TEXT NOT NULL,
  reason          TEXT,
  correlation_id  TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ
);

-- ── account ownership & pix directory ────────────────────────────────────────

CREATE TABLE channel_experience.account_ownership (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  ledger_account_id TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'BLOCKED', 'CLOSED')),
  opened_at       TIMESTAMPTZ,
  correlation_id  TEXT NOT NULL,
  UNIQUE (customer_id, ledger_account_id)
);

CREATE TABLE channel_experience.pix_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  ledger_account_id TEXT NOT NULL,
  key_type        TEXT NOT NULL,
  key_value_hash  TEXT NOT NULL,
  display_mask    TEXT NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key_type, key_value_hash)
);

CREATE TABLE channel_experience.pix_directory_entries (
  key_type          TEXT NOT NULL,
  key_value_hash    TEXT NOT NULL,
  customer_id       UUID NOT NULL REFERENCES channel_experience.customers(id),
  ledger_account_id TEXT NOT NULL,
  display_name      TEXT NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key_type, key_value_hash)
);

-- ── projections & receipts (derivados do core/outbox — não append no BFF) ─────

CREATE TABLE channel_experience.transaction_projections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES channel_experience.customers(id),
  payment_id          TEXT NOT NULL,
  transaction_id      TEXT NOT NULL,
  correlation_id      TEXT NOT NULL,
  idempotency_key     TEXT NOT NULL,
  ledger_sequence     BIGINT,
  projection_sequence   BIGINT NOT NULL,
  direction           TEXT NOT NULL CHECK (direction IN ('inflow', 'outflow')),
  amount_cents        BIGINT NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'BRL',
  title               TEXT NOT NULL,
  party               TEXT NOT NULL,
  channel             TEXT NOT NULL,
  payment_state       channel_experience.payment_channel_state NOT NULL,
  occurred_at         TIMESTAMPTZ NOT NULL,
  projected_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, payment_id),
  UNIQUE (customer_id, idempotency_key),
  UNIQUE (customer_id, projection_sequence)
);

CREATE INDEX idx_tx_projection_customer_time
  ON channel_experience.transaction_projections (customer_id, occurred_at DESC);

CREATE TABLE channel_experience.receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id      TEXT NOT NULL UNIQUE,
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  payment_id      TEXT NOT NULL,
  transaction_id  TEXT NOT NULL,
  correlation_id  TEXT NOT NULL,
  payload_hash    TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE channel_experience.journey_checkpoints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id      TEXT NOT NULL REFERENCES channel_experience.onboarding_journeys(journey_id),
  checkpoint_key  TEXT NOT NULL,
  payload_hash    TEXT NOT NULL,
  channel         channel_experience.channel_kind NOT NULL,
  device_id       UUID REFERENCES channel_experience.devices(id),
  correlation_id  TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (journey_id, checkpoint_key)
);

-- ── audit trail document assets (append-only) ───────────────────────────────

CREATE TABLE channel_experience.document_asset_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_asset_id UUID NOT NULL REFERENCES channel_experience.document_assets(id),
  action          TEXT NOT NULL,
  actor           TEXT NOT NULL,
  correlation_id  TEXT NOT NULL,
  previous_hash   TEXT,
  event_hash      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;