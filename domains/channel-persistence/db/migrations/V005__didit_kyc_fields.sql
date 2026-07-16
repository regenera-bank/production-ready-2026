-- V005 — Campos Didit no perfil de onboarding (KYC_PROVIDER=didit)

BEGIN;

ALTER TABLE channel_experience.onboarding_profiles
  ADD COLUMN IF NOT EXISTS didit_session_id TEXT,
  ADD COLUMN IF NOT EXISTS didit_status TEXT;

COMMIT;