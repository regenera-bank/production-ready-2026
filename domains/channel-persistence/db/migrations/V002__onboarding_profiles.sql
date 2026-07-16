-- V002 — Perfis de onboarding + metadados de jornada (Onda 2)
-- Substitui fatia onboarding/journeys do homolog-store em PostgreSQL.

BEGIN;

ALTER TABLE channel_experience.onboarding_journeys
  ADD COLUMN IF NOT EXISTS journey_type TEXT NOT NULL DEFAULT 'ACCOUNT_OPENING',
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS app_version TEXT,
  ADD COLUMN IF NOT EXISTS platform_version TEXT,
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

CREATE TABLE IF NOT EXISTS channel_experience.onboarding_profiles (
  customer_id         UUID PRIMARY KEY REFERENCES channel_experience.customers(id),
  external_ref        TEXT NOT NULL UNIQUE,
  kyc_status          TEXT NOT NULL DEFAULT 'PENDING',
  account_status      TEXT NOT NULL DEFAULT 'NONE',
  kyc_step            TEXT NOT NULL DEFAULT 'cadastral',
  kyc_id              TEXT,
  kyc_reason          TEXT,
  identity_source     TEXT,
  pep_score           INTEGER,
  document_asset_id   TEXT,
  account_opened_at   TIMESTAMPTZ,
  kyc_submitted_at    TIMESTAMPTZ,
  kyc_approved_at     TIMESTAMPTZ,
  active_journey_id   TEXT REFERENCES channel_experience.onboarding_journeys(journey_id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_active_journey
  ON channel_experience.onboarding_profiles (active_journey_id)
  WHERE active_journey_id IS NOT NULL;

COMMIT;