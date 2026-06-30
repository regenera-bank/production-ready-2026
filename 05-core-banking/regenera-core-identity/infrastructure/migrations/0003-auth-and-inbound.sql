-- =============================================================================
-- MIGRATION 0003 — SESSÕES, DISPOSITIVOS E EVENTOS DE ENTRADA
-- =============================================================================

-- sessão não é login.
-- é permissão viva.
-- se vazar, alguém opera como outro.

-- segurança não falha em um ponto.
-- falha em cadeia.
-- quando você percebe, já tem sessão válida em mãos erradas.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. DISPOSITIVOS
-- ---------------------------------------------------------------------------

-- dispositivo não é detalhe.
-- é identidade persistente fora do usuário.
-- se isso aqui for fraco, fraude parece legítima.

CREATE TABLE auth_devices (

  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id           uuid NOT NULL,

  fingerprint_hash  char(64) NOT NULL,
  -- isso aqui não identifica pessoa.
  -- identifica ambiente.
  -- colisão aqui vira falsa confiança.

  platform          varchar(12) NOT NULL
                    CHECK (platform IN ('WEB','IOS','ANDROID')),

  display_name      varchar(80) NOT NULL,

  trusted_at        timestamptz,
  -- confiança não é padrão.
  -- é conquistada e pode ser retirada.

  revoked_at        timestamptz,
  revoked_by        varchar(80),
  -- se não souber quem revogou, auditoria já abriu incidente.

  first_seen_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_auth_devices
    UNIQUE (user_id, fingerprint_hash)
  -- mesma máquina não pode nascer duas vezes.
  -- se duplicar, tracking já quebrou.

);

CREATE INDEX idx_auth_devices_user
ON auth_devices (user_id)
WHERE revoked_at IS NULL;
-- índice parcial evita misturar dispositivo morto com ativo.
-- sem isso, consulta erra sob carga.

-- ---------------------------------------------------------------------------
-- 2. SESSÕES
-- ---------------------------------------------------------------------------

-- sessão é onde o ataque vira dinheiro.
-- aqui não pode ter ambiguidade.

CREATE TABLE auth_sessions (

  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id            uuid NOT NULL,

  device_id          uuid NOT NULL
                     REFERENCES auth_devices(id),

  family_id          uuid NOT NULL,
  -- rotação vive aqui.
  -- replay também.

  refresh_token_hash char(64) NOT NULL UNIQUE,
  -- token não é segredo aqui.
  -- hash é prova.
  -- se vazar token original, esse campo segura replay.

  parent_session_id  uuid
                     REFERENCES auth_sessions(id),
  -- cadeia de rotação.
  -- se quebrar, não dá pra invalidar família inteira.

  status             varchar(12) NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN (
                       'ACTIVE','ROTATED','REVOKED','EXPIRED'
                     )),

  step_up_until      timestamptz,
  -- elevação temporária.
  -- se não expira, vira privilégio permanente.

  ip_hash            char(64) NOT NULL,
  -- IP não é identidade.
  -- mas ausência disso é cegueira total.

  user_agent         varchar(300) NOT NULL,

  expires_at         timestamptz NOT NULL,
  -- sessão sem expiração é acesso eterno.

  created_at         timestamptz NOT NULL DEFAULT now(),

  closed_at          timestamptz,
  closed_reason      varchar(40),

  CONSTRAINT ck_session_closed CHECK (
    status = 'ACTIVE'
    OR closed_at IS NOT NULL
  )
  -- sessão morta sem timestamp é mentira histórica.

);

CREATE INDEX idx_auth_sessions_user
ON auth_sessions (user_id, status);

CREATE INDEX idx_auth_sessions_family
ON auth_sessions (family_id);
-- sem isso, revogar em cascata vira full scan.
-- full scan em incidente = tempo perdido = dano ampliado.

-- ---------------------------------------------------------------------------
-- 3. EVENTOS DE AUTENTICAÇÃO
-- ---------------------------------------------------------------------------

-- isso aqui não é log.
-- é reconstrução de incidente.

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
                    -- esse aqui é linha de morte.
                    -- se não registrar, ataque passa limpo.

                    'SESSION_REVOKED',

                    'STEP_UP_GRANTED',
                    'STEP_UP_FAILED',

                    'DEVICE_TRUSTED',
                    'DEVICE_REVOKED',

                    'ACCOUNT_LOCKDOWN'

                  )),

  ip_hash         char(64) NOT NULL,

  detail          jsonb,
  -- aqui mora evidência.
  -- sem padrão, vira lixo.
  -- lixo não passa auditoria.

  occurred_at     timestamptz NOT NULL DEFAULT now()

);

CREATE INDEX idx_auth_events_user
ON auth_events (user_id, occurred_at);

CREATE INDEX idx_auth_events_type
ON auth_events (event_type, occurred_at);

-- ---------------------------------------------------------------------------
-- 3.1 IMUTABILIDADE
-- ---------------------------------------------------------------------------

-- evento de segurança não volta atrás.
-- se alguém editar isso, perdeu cadeia de evidência.

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

-- webhook mente.
-- parceiro erra.
-- retry duplica.
-- aqui você decide acreditar ou não.

CREATE TABLE inbound_events (

  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  source             varchar(40) NOT NULL,
  -- origem não confiável por padrão.

  external_event_id  varchar(160) NOT NULL,
  -- isso aqui é chave de idempotência externa.
  -- se duplicar, sistema processa duas vezes.

  signature_valid    boolean NOT NULL,
  -- falso aqui deveria impedir processamento.
  -- se não impedir, segurança é teatro.

  payload_hash       char(64) NOT NULL,
  -- payload muda → evento muda.
  -- mesmo id com hash diferente = ataque ou bug grave.

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
  -- duplicidade aqui não é erro técnico.
  -- é efeito colateral financeiro.

);

CREATE INDEX idx_inbound_events_status
ON inbound_events (status, received_at);
-- fila operacional.
-- sem isso, retry vira caos.

COMMIT;

-- ---------------------------------------------------------------------------
-- ROLLBACK PLAN
-- ---------------------------------------------------------------------------

-- apagar isso não limpa nada.
-- só remove prova.

-- se pedirem rollback em produção:
-- registre quem pediu antes de executar.

-- execute apenas em ambiente descartável.
