-- =============================================================================
-- MIGRATION 0002 — COMPLIANCE E PRIVACIDADE
-- =============================================================================

-- isso aqui não protege só o sistema.
-- protege a empresa de ela mesma.
-- e às vezes, protege o cliente dela também.

BEGIN;



CREATE EXTENSION IF NOT EXISTS pgcrypto;



-- ---------------------------------------------------------------------------
-- 1. KYC — IDENTIDADE NÃO É OPINIONÁVEL
-- ---------------------------------------------------------------------------

-- aqui a gente decide se alguém existe “o suficiente” pra operar.

CREATE TABLE kyc_profiles (

  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id             uuid NOT NULL UNIQUE,

  level               varchar(12) NOT NULL DEFAULT 'BASIC'
                      CHECK (level IN ('BASIC','INTERMEDIATE','FULL')),

  status              varchar(16) NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN (
                        'PENDING','IN_REVIEW','APPROVED','REJECTED','EXPIRED'
                      )),

  document_type       varchar(12)
                      CHECK (document_type IN ('CPF','CNPJ','RG','CNH','PASSPORT')),

  document_hash       char(64),

  full_name_encrypted bytea,
  birth_date_encrypted bytea,

  provider_reference  varchar(120),

  risk_score          smallint CHECK (risk_score BETWEEN 0 AND 100),

  approved_at         timestamptz,
  expires_at          timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  row_version         integer NOT NULL DEFAULT 1,

  CONSTRAINT ck_kyc_approved_complete CHECK (
    status <> 'APPROVED'
    OR (approved_at IS NOT NULL AND expires_at IS NOT NULL)
  )

);



CREATE INDEX idx_kyc_profiles_status
ON kyc_profiles (status, updated_at);



-- ---------------------------------------------------------------------------
-- 2. COMPLIANCE CASES — QUANDO O SISTEMA PARA PRA OLHAR DE PERTO
-- ---------------------------------------------------------------------------

-- aqui nada é automático.
-- tudo vira caso. tudo vira decisão.

CREATE TABLE compliance_cases (

  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  case_number     bigint GENERATED ALWAYS AS IDENTITY,

  account_id      uuid NOT NULL,

  origin_type     varchar(24) NOT NULL
                  CHECK (origin_type IN (
                    'AML_ALERT',
                    'SANCTIONS_HIT',
                    'PEP_HIT',
                    'MANUAL',
                    'FRAUD_SIGNAL'
                  )),

  origin_id       uuid,

  severity        varchar(8) NOT NULL
                  CHECK (severity IN ('MEDIUM','HIGH','CRITICAL')),

  status          varchar(16) NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN (
                    'OPEN','IN_REVIEW','ESCALATED','REPORTED_COAF','CLOSED'
                  )),

  assigned_to     varchar(80),

  summary         varchar(500) NOT NULL,
  resolution      varchar(1000),

  sla_due_at      timestamptz NOT NULL,
  closed_at       timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ck_case_closed_complete CHECK (
    status <> 'CLOSED'
    OR (closed_at IS NOT NULL AND resolution IS NOT NULL)
  )

);



CREATE INDEX idx_compliance_cases_queue
ON compliance_cases (status, severity, sla_due_at);

CREATE INDEX idx_compliance_cases_account
ON compliance_cases (account_id);



-- ---------------------------------------------------------------------------
-- 3. SANCTIONS SCREENING — O MUNDO EXTERNO SEM FILTRO
-- ---------------------------------------------------------------------------

-- aqui o sistema pergunta pro mundo:
-- “esse sujeito pode existir aqui?”

CREATE TABLE sanctions_screenings (

  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  subject_type    varchar(12) NOT NULL
                  CHECK (subject_type IN ('USER','COUNTERPARTY')),

  subject_id      uuid NOT NULL,

  list_source     varchar(24) NOT NULL
                  CHECK (list_source IN (
                    'OFAC','UN','EU','UK_HMT','COAF_NACIONAL'
                  )),

  list_version    varchar(40) NOT NULL,

  query_hash      char(64) NOT NULL,

  result          varchar(12) NOT NULL
                  CHECK (result IN ('CLEAR','HIT','REVIEW')),

  match_score     numeric(5,2)
                  CHECK (match_score BETWEEN 0 AND 100),

  match_details   jsonb,

  case_id         uuid REFERENCES compliance_cases(id),

  screened_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ck_sanctions_hit_has_case CHECK (
    result = 'CLEAR' OR case_id IS NOT NULL
  )

);



CREATE INDEX idx_sanctions_subject
ON sanctions_screenings (subject_type, subject_id, screened_at);



-- ---------------------------------------------------------------------------
-- 4. PEP SCREENING — POLÍTICA NÃO É DETALHE
-- ---------------------------------------------------------------------------

CREATE TABLE pep_screenings (

  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id         uuid NOT NULL,

  list_source     varchar(24) NOT NULL,
  list_version    varchar(40) NOT NULL,

  result          varchar(12) NOT NULL
                  CHECK (result IN ('CLEAR','HIT','REVIEW')),

  pep_category    varchar(40),

  relationship    varchar(24)
                  CHECK (relationship IN (
                    'SELF','FAMILY','CLOSE_ASSOCIATE'
                  )),

  match_details   jsonb,

  case_id         uuid REFERENCES compliance_cases(id),

  screened_at     timestamptz NOT NULL DEFAULT now(),

  valid_until     timestamptz NOT NULL,

  CONSTRAINT ck_pep_hit_has_case CHECK (
    result = 'CLEAR' OR case_id IS NOT NULL
  )

);



CREATE INDEX idx_pep_user
ON pep_screenings (user_id, screened_at);



-- ---------------------------------------------------------------------------
-- 5. ACCOUNT RESTRICTIONS — O FREIO DE MÃO DO SISTEMA
-- ---------------------------------------------------------------------------

-- aqui o sistema não bloqueia “um usuário”.
-- bloqueia capacidade.

CREATE TABLE account_restrictions (

  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  account_id      uuid NOT NULL,

  restriction     varchar(24) NOT NULL
                  CHECK (restriction IN (
                    'FULL_FREEZE',
                    'DEBIT_BLOCK',
                    'CREDIT_BLOCK',
                    'PIX_BLOCK',
                    'LIMIT_OVERRIDE'
                  )),

  reason_code     varchar(40) NOT NULL,

  case_id         uuid REFERENCES compliance_cases(id),

  applied_by      varchar(80) NOT NULL,
  legal_basis     varchar(200) NOT NULL,

  params          jsonb,

  applied_at      timestamptz NOT NULL DEFAULT now(),

  expires_at      timestamptz,
  lifted_at       timestamptz,

  lifted_by       varchar(80),
  lift_reason     varchar(300),

  CONSTRAINT ck_restriction_lift_complete CHECK (
    lifted_at IS NULL
    OR (lifted_at IS NOT NULL AND lifted_by IS NOT NULL AND lift_reason IS NOT NULL)
  )

);



CREATE UNIQUE INDEX uq_restriction_active
ON account_restrictions (account_id, restriction)
WHERE lifted_at IS NULL;



CREATE INDEX idx_restrictions_account
ON account_restrictions (account_id)
WHERE lifted_at IS NULL;



-- ---------------------------------------------------------------------------
-- 6. PRIVACY REQUESTS — DIREITO DO USUÁRIO NÃO É “FEATURE”
-- ---------------------------------------------------------------------------

-- isso aqui não é fila de suporte.
-- é obrigação legal persistente.

CREATE TABLE privacy_requests (

  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id         uuid NOT NULL,

  request_type    varchar(24) NOT NULL
                  CHECK (request_type IN (
                    'ACCESS',
                    'CORRECTION',
                    'DELETION',
                    'PORTABILITY',
                    'REVOKE_CONSENT'
                  )),

  status          varchar(16) NOT NULL DEFAULT 'RECEIVED'
                  CHECK (status IN (
                    'RECEIVED','IN_PROGRESS','FULFILLED',
                    'PARTIALLY_DENIED','DENIED'
                  )),

  channel         varchar(12) NOT NULL
                  CHECK (channel IN ('MOBILE','WEB','EMAIL','DPO')),

  details         jsonb,

  denial_basis    varchar(300),

  due_at          timestamptz NOT NULL,

  fulfilled_at    timestamptz,

  evidence_hash   char(64),

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ck_privacy_denial_basis CHECK (
    status NOT IN ('DENIED','PARTIALLY_DENIED')
    OR denial_basis IS NOT NULL
  ),

  CONSTRAINT ck_privacy_fulfilled_evidence CHECK (
    status <> 'FULFILLED'
    OR (fulfilled_at IS NOT NULL AND evidence_hash IS NOT NULL)
  )

);



CREATE INDEX idx_privacy_requests_sla
ON privacy_requests (status, due_at);



-- ---------------------------------------------------------------------------
-- 7. DATA ACCESS LOGS — AUDITORIA NÃO SE DISCUTE
-- ---------------------------------------------------------------------------

-- se alguém acessou dado, isso aqui sabe.

CREATE TABLE data_access_logs (

  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  actor_id        varchar(80) NOT NULL,
  actor_role      varchar(40) NOT NULL,

  subject_user_id uuid NOT NULL,

  resource        varchar(80) NOT NULL,

  action          varchar(12) NOT NULL
                  CHECK (action IN ('READ','EXPORT','UPDATE','DELETE')),

  permission_used varchar(64) NOT NULL,

  justification   varchar(300),

  correlation_id  uuid NOT NULL,

  accessed_at     timestamptz NOT NULL DEFAULT now()

);



CREATE INDEX idx_data_access_subject
ON data_access_logs (subject_user_id, accessed_at);

CREATE INDEX idx_data_access_actor
ON data_access_logs (actor_id, accessed_at);



-- ---------------------------------------------------------------------------
-- 7.1 IMUTABILIDADE — LOG NÃO VOLTA ATRÁS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION forbid_access_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'data_access_logs é append-only: operação % proibida', TG_OP;
END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER trg_data_access_logs_immutable
BEFORE UPDATE OR DELETE ON data_access_logs
FOR EACH ROW EXECUTE FUNCTION forbid_access_log_mutation();



COMMIT;



-- ---------------------------------------------------------------------------
-- ROLLBACK PLAN
-- ---------------------------------------------------------------------------

--- Apagar compliance não é “rollback” .
-- é apagar histórico regulatório.
-- só faz isso em ambiente descartável.
