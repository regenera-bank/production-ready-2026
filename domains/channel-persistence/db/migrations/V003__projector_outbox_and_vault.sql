-- V003 — Fila do transaction-projector + índice document_assets por cliente
BEGIN;

CREATE TABLE IF NOT EXISTS channel_experience.projector_outbox (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projector_outbox_pending
  ON channel_experience.projector_outbox (created_at)
  WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_document_assets_customer
  ON channel_experience.document_assets (customer_id, created_at DESC);

COMMIT;