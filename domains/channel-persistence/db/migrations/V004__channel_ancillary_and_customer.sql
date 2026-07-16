-- V004 — Ancillary channel state (consents, passkeys, sandbox audit, integration)
-- Substitui fatia local do homolog-store.json. Cliente §4 estendido.

BEGIN;

ALTER TABLE channel_experience.customers
  ADD COLUMN IF NOT EXISTS civil_name TEXT,
  ADD COLUMN IF NOT EXISTS social_name TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS declared_income_cents BIGINT CHECK (declared_income_cents IS NULL OR declared_income_cents >= 0),
  ADD COLUMN IF NOT EXISTS tax_residency_country CHAR(2) NOT NULL DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS aml_status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS channel_experience.customer_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  consent_type    TEXT NOT NULL CHECK (consent_type IN ('TERMS_OF_USE', 'PRIVACY_POLICY', 'MARKETING', 'OPEN_FINANCE')),
  version         TEXT NOT NULL,
  channel         channel_experience.channel_kind NOT NULL,
  accepted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ,
  UNIQUE (customer_id, consent_type, version, channel, accepted_at)
);

CREATE INDEX IF NOT EXISTS idx_customer_consents_active
  ON channel_experience.customer_consents (customer_id, consent_type)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS channel_experience.passkey_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  credential_id   TEXT NOT NULL UNIQUE,
  public_key_b64  TEXT NOT NULL,
  counter         BIGINT NOT NULL DEFAULT 0 CHECK (counter >= 0),
  transports      TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS channel_experience.integration_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain          TEXT NOT NULL,
  record_key      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (domain, record_key)
);

CREATE TABLE IF NOT EXISTS channel_experience.sandbox_audit_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain          TEXT NOT NULL CHECK (domain IN ('lifestyle', 'products', 'prometeo')),
  customer_id     UUID REFERENCES channel_experience.customers(id),
  external_ref    TEXT,
  module_id       TEXT,
  action          TEXT NOT NULL,
  reference_id    TEXT NOT NULL,
  status          TEXT NOT NULL,
  payload         JSONB,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_audit_customer
  ON channel_experience.sandbox_audit_events (external_ref, occurred_at DESC);

CREATE TABLE IF NOT EXISTS channel_experience.ui_preferences (
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  preference_key  TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  channel         channel_experience.channel_kind NOT NULL DEFAULT 'WEB',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, preference_key, channel)
);

CREATE TABLE IF NOT EXISTS channel_experience.customer_profile_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES channel_experience.customers(id),
  field_name      TEXT NOT NULL,
  previous_hash   TEXT,
  new_hash        TEXT NOT NULL,
  actor           TEXT NOT NULL,
  correlation_id  TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;