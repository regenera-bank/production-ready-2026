-- =============================================================================
-- MIGRATION 0003 — SESSÕES, DISPOSITIVOS E EVENTOS DE ENTRADA
-- =============================================================================

-- segurança quase nunca quebra de uma vez.
-- normalmente quebra aos poucos.
-- um token aqui.
-- um dispositivo ali.
-- quando alguém percebe, já virou incidente.

BEGIN;



CREATE EXTENSION IF NOT EXISTS pgcrypto;



-- ---------------------------------------------------------------------------
-- 1. DISPOSITIVOS
-- ---------------------------------------------------------------------------

-- usuário entra e sai.
-- dispositivo fica.
-- quase sempre é ele que entrega a história inteira.

CREATE TABLE auth_devices (

  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id           uuid NOT NULL,

  fingerprint_hash  char(64) NOT NULL,

  platform          varchar(12) NOT NULL
                    CHECK (platform IN (
                      'WEB',
                      'IOS',
                      'ANDROID'
                    )),

  display_name      varchar(80) NOT NULL,

  trusted_at        timestamptz,

  revoked_at        timestamptz,
  revoked_by        varchar(80),

  first_seen_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_auth_devices
    UNIQUE (user_id, fingerprint_hash)

);



CREATE INDEX idx_auth_devices_user
ON auth_devices (user_id)
WHERE revoked_at IS NULL;



-- ---------------------------------------------------------------------------
-- 2. SESSÕES
-- ---------------------------------------------------------------------------

-- sessão parece simples.
-- até precisar revogar uma família inteira de refresh tokens.

CREATE TABLE auth_sessions (

  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id            uuid NOT NULL,

  device_id          uuid NOT NULL
                     REFERENCES auth_devices(id),

  family_id          uuid NOT NULL,
  -- rotação começa aqui.
  -- termina aqui também.

  refresh_token_hash char(64) NOT NULL UNIQUE,

  parent_session_id  uuid
                     REFERENCES auth_sessions(id),

  status             varchar(12) NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN (
                       'ACTIVE',
                       'ROTATED',
                       'REVOKED',
                       'EXPIRED'
                     )),

  step_up_until      timestamptz,

  ip_hash            char(64) NOT NULL,

  user_agent         varchar(300) NOT NULL,

  expires_at         timestamptz NOT NULL,

  created_at         timestamptz NOT NULL DEFAULT now(),

  closed_at          timestamptz,
  closed_reason      varchar(40),

  CONSTRAINT ck_session_closed CHECK (
    status = 'ACTIVE'
    OR closed_at IS NOT NULL
  )

);



CREATE INDEX idx_auth_sessions_user
ON auth_sessions (user_id, status);



CREATE INDEX idx_auth_sessions_family
ON auth_sessions (family_id);



-- ---------------------------------------------------------------------------
-- 3. EVENTOS DE AUTENTICAÇÃO
-- ---------------------------------------------------------------------------

-- quando tudo der errado,
-- normalmente a resposta está aqui.

CREATE TABLE auth_events (

  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id         uuid,

  device_id       uuid,

  session_id      uuid,

  event_type      varchar(40) NOT NULL
                  CHECK (event_type IN (

                    'LOGIN_SUCCESS',
                    'LOGIN_FAILED',

                    'MFA_SUCCESS',
                    'MFA_FAILED',

                    'REFRESH_ROTATED',
                    'REFRESH_REPLAY_DETECTED',

                    'SESSION_REVOKED',

                    'STEP_UP_GRANTED',
                    'STEP_UP_FAILED',

                    'DEVICE_TRUSTED',
                    'DEVICE_REVOKED',

                    'ACCOUNT_LOCKDOWN'

                  )),

  ip_hash         char(64) NOT NULL,

  detail          jsonb,

  occurred_at     timestamptz NOT NULL DEFAULT now()

);



CREATE INDEX idx_auth_events_user
ON auth_events (user_id, occurred_at);



CREATE INDEX idx_auth_events_type
ON auth_events (event_type, occurred_at);



-- ---------------------------------------------------------------------------
-- 3.1 IMUTABILIDADE
-- ---------------------------------------------------------------------------

-- log de segurança não é opinião.
-- não existe "corrigir depois".

CREATE OR REPLACE FUNCTION forbid_auth_event_mutation()
RETURNS trigger AS $$
BEGIN

  RAISE EXCEPTION
    'auth_events é append-only: operação % proibida',
    TG_OP;

END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER trg_auth_events_immutable
BEFORE UPDATE OR DELETE ON auth_events
FOR EACH ROW EXECUTE FUNCTION forbid_auth_event_mutation();



-- ---------------------------------------------------------------------------
-- 4. EVENTOS DE ENTRADA
-- ---------------------------------------------------------------------------

-- webhooks chegam.
-- filas chegam.
-- parceiros chegam.
-- confiança não.

CREATE TABLE inbound_events (

  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  source             varchar(40) NOT NULL,
  -- banco
  -- provedor
  -- parceiro
  -- qualquer coisa que jure estar falando a verdade

  external_event_id  varchar(160) NOT NULL,

  signature_valid    boolean NOT NULL,

  payload_hash       char(64) NOT NULL,

  status             varchar(12) NOT NULL DEFAULT 'RECEIVED'
                     CHECK (status IN (
                       'RECEIVED',
                       'PROCESSING',
                       'COMPLETED',
                       'REJECTED'
                     )),

  received_at        timestamptz NOT NULL DEFAULT now(),

  processed_at       timestamptz,

  failure_detail     varchar(500),

  CONSTRAINT uq_inbound_events
    UNIQUE (source, external_event_id)

);



CREATE INDEX idx_inbound_events_status
ON inbound_events (status, received_at);



COMMIT;



-- ---------------------------------------------------------------------------
-- ROLLBACK PLAN
-- ---------------------------------------------------------------------------

-- apagar trilha de autenticação não é limpeza.
-- é destruição de evidência.

-- se alguém pedir isso em produção,
-- provavelmente vale registrar quem pediu.

-- executar apenas em ambiente descartável.
