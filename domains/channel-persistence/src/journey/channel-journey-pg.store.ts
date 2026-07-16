import { createHash } from 'crypto';
import { Pool } from 'pg';
import type {
  AccountOpeningState,
  JourneyChannel,
  JourneyRecord,
  JourneySnapshot,
  JourneyType,
  OnboardingRecord,
  OnboardingTransition,
} from './channel-journey.types';
import { emptyJourneySnapshot } from './channel-journey.types';

type PgJourneyState =
  | 'DRAFT'
  | 'PERSONAL_DATA_PENDING'
  | 'DOCUMENTS_PENDING'
  | 'DOCUMENTS_PROCESSING'
  | 'SELFIE_PENDING'
  | 'LIVENESS_PROCESSING'
  | 'KYC_PROCESSING'
  | 'MANUAL_REVIEW'
  | 'APPROVED'
  | 'ACCOUNT_CREATING'
  | 'AUTHENTICATOR_PENDING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

const toPgState = (state: AccountOpeningState): PgJourneyState => {
  if (state === 'LIVENESS_PENDING') {
    return 'LIVENESS_PROCESSING';
  }
  return state as PgJourneyState;
};

const fromPgState = (state: string): AccountOpeningState => {
  if (state === 'LIVENESS_PROCESSING') {
    return 'LIVENESS_PENDING';
  }
  if (state === 'DOCUMENTS_PROCESSING') {
    return 'DOCUMENTS_PENDING';
  }
  if (state === 'AUTHENTICATOR_PENDING') {
    return 'ACCOUNT_CREATING';
  }
  return state as AccountOpeningState;
};

const hashDocument = (document: string): string =>
  createHash('sha256')
    .update(document.replace(/\D/g, '').slice(-11))
    .digest('hex');

/**
 * Projeção PG da jornada — onboarding_journeys + onboarding_profiles + transitions.
 */
export class ChannelJourneyPgStore {
  constructor(private readonly pool: Pool) {}

  async loadSnapshot(): Promise<JourneySnapshot> {
    const snapshot = emptyJourneySnapshot();

    const journeys = await this.pool.query<{
      journey_id: string;
      external_ref: string;
      channel: JourneyChannel;
      current_state: string;
      version: string;
      correlation_id: string;
      expires_at: Date;
      created_at: Date;
      updated_at: Date;
      journey_type: JourneyType;
      locale: string;
      app_version: string | null;
      platform_version: string | null;
      device_fingerprint: string | null;
    }>(
      `SELECT j.journey_id, c.external_ref, j.channel, j.current_state::text,
              j.version, j.correlation_id, j.expires_at, j.created_at, j.updated_at,
              j.journey_type, j.locale, j.app_version, j.platform_version, j.device_fingerprint
       FROM channel_experience.onboarding_journeys j
       JOIN channel_experience.customers c ON c.id = j.customer_id`,
    );

    for (const row of journeys.rows) {
      const record: JourneyRecord = {
        journeyId: row.journey_id,
        journeyType: row.journey_type,
        userId: row.external_ref,
        channel: row.channel,
        deviceId: row.device_fingerprint ?? 'unknown',
        locale: row.locale,
        appVersion: row.app_version ?? undefined,
        platformVersion: row.platform_version ?? undefined,
        currentState: fromPgState(row.current_state),
        version: Number(row.version),
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        expiresAt: row.expires_at.toISOString(),
      };
      snapshot.journeys[row.journey_id] = record;
    }

    const profiles = await this.pool.query<{
      external_ref: string;
      kyc_status: string;
      account_status: string;
      kyc_step: string;
      kyc_id: string | null;
      kyc_reason: string | null;
      identity_source: string | null;
      pep_score: number | null;
      document_asset_id: string | null;
      account_opened_at: Date | null;
      kyc_submitted_at: Date | null;
      kyc_approved_at: Date | null;
      active_journey_id: string | null;
      didit_session_id: string | null;
      didit_status: string | null;
    }>(
      `SELECT external_ref, kyc_status, account_status, kyc_step, kyc_id, kyc_reason,
              identity_source, pep_score, document_asset_id, account_opened_at,
              kyc_submitted_at, kyc_approved_at, active_journey_id,
              didit_session_id, didit_status
       FROM channel_experience.onboarding_profiles`,
    );

    for (const row of profiles.rows) {
      snapshot.onboarding[row.external_ref] = {
        userId: row.external_ref,
        kycStatus: row.kyc_status as OnboardingRecord['kycStatus'],
        accountStatus: row.account_status as OnboardingRecord['accountStatus'],
        kycStep: row.kyc_step as OnboardingRecord['kycStep'],
        kycId: row.kyc_id ?? undefined,
        kycReason: row.kyc_reason ?? undefined,
        identitySource: row.identity_source ?? undefined,
        pepScore: row.pep_score ?? undefined,
        documentAssetId: row.document_asset_id ?? undefined,
        accountOpenedAt: row.account_opened_at?.toISOString(),
        kycSubmittedAt: row.kyc_submitted_at?.toISOString(),
        kycApprovedAt: row.kyc_approved_at?.toISOString(),
        diditSessionId: row.didit_session_id ?? undefined,
        diditStatus: row.didit_status ?? undefined,
      };
      if (row.active_journey_id && snapshot.journeys[row.active_journey_id]) {
        snapshot.journeyActiveByUserId[row.external_ref] = row.active_journey_id;
      }
    }

    const transitions = await this.pool.query<{
      id: string;
      journey_id: string;
      previous_state: string;
      new_state: string;
      command: string;
      actor: string;
      channel: JourneyChannel;
      correlation_id: string;
      version: string;
      created_at: Date;
    }>(
      `SELECT id, journey_id, previous_state::text, new_state::text, command, actor,
              channel, correlation_id, version, created_at
       FROM channel_experience.onboarding_transitions
       ORDER BY created_at ASC`,
    );

    snapshot.transitions = transitions.rows.map(
      (row): OnboardingTransition => ({
        id: row.id,
        journeyId: row.journey_id,
        previousState: fromPgState(row.previous_state),
        newState: fromPgState(row.new_state),
        command: row.command,
        actor: row.actor,
        channel: row.channel,
        correlationId: row.correlation_id,
        version: Number(row.version),
        createdAt: row.created_at.toISOString(),
      }),
    );

    return snapshot;
  }

  async syncSnapshot(snapshot: JourneySnapshot): Promise<void> {
    for (const record of Object.values(snapshot.journeys)) {
      if (!record.userId) {
        continue;
      }
      await this.upsertJourney(record);
    }
    for (const [userId, profile] of Object.entries(snapshot.onboarding)) {
      const activeJourneyId = snapshot.journeyActiveByUserId[userId];
      await this.upsertOnboardingProfile(userId, profile, activeJourneyId);
    }
    for (const transition of snapshot.transitions) {
      await this.appendTransitionIfMissing(transition);
    }
  }

  async upsertJourney(record: JourneyRecord): Promise<void> {
    if (!record.userId) {
      return;
    }
    const customerId = await this.ensureCustomerId(record.userId);
    await this.pool.query(
      `INSERT INTO channel_experience.onboarding_journeys
         (journey_id, customer_id, channel, current_state, version, correlation_id,
          expires_at, journey_type, locale, app_version, platform_version,
          device_fingerprint, created_at, updated_at)
       VALUES ($1, $2, $3::channel_experience.channel_kind, $4::channel_experience.journey_state,
               $5, $6, $7::timestamptz, $8, $9, $10, $11, $12, $13::timestamptz, $14::timestamptz)
       ON CONFLICT (journey_id) DO UPDATE SET
         current_state = EXCLUDED.current_state,
         version = EXCLUDED.version,
         expires_at = EXCLUDED.expires_at,
         journey_type = EXCLUDED.journey_type,
         locale = EXCLUDED.locale,
         app_version = EXCLUDED.app_version,
         platform_version = EXCLUDED.platform_version,
         device_fingerprint = EXCLUDED.device_fingerprint,
         updated_at = EXCLUDED.updated_at`,
      [
        record.journeyId,
        customerId,
        record.channel,
        toPgState(record.currentState),
        record.version,
        record.journeyId,
        record.expiresAt,
        record.journeyType,
        record.locale,
        record.appVersion ?? null,
        record.platformVersion ?? null,
        record.deviceId,
        record.createdAt,
        record.updatedAt,
      ],
    );
  }

  async upsertOnboardingProfile(
    userId: string,
    profile: OnboardingRecord,
    activeJourneyId?: string,
  ): Promise<void> {
    const customerId = await this.ensureCustomerId(userId);
    await this.pool.query(
      `INSERT INTO channel_experience.onboarding_profiles
         (customer_id, external_ref, kyc_status, account_status, kyc_step, kyc_id, kyc_reason,
          identity_source, pep_score, document_asset_id, account_opened_at, kyc_submitted_at,
          kyc_approved_at, active_journey_id, didit_session_id, didit_status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamptz, $12::timestamptz,
               $13::timestamptz, $14, $15, $16, now())
       ON CONFLICT (external_ref) DO UPDATE SET
         kyc_status = EXCLUDED.kyc_status,
         account_status = EXCLUDED.account_status,
         kyc_step = EXCLUDED.kyc_step,
         kyc_id = EXCLUDED.kyc_id,
         kyc_reason = EXCLUDED.kyc_reason,
         identity_source = EXCLUDED.identity_source,
         pep_score = EXCLUDED.pep_score,
         document_asset_id = EXCLUDED.document_asset_id,
         account_opened_at = EXCLUDED.account_opened_at,
         kyc_submitted_at = EXCLUDED.kyc_submitted_at,
         kyc_approved_at = EXCLUDED.kyc_approved_at,
         active_journey_id = EXCLUDED.active_journey_id,
         didit_session_id = EXCLUDED.didit_session_id,
         didit_status = EXCLUDED.didit_status,
         updated_at = now()`,
      [
        customerId,
        userId,
        profile.kycStatus,
        profile.accountStatus,
        profile.kycStep,
        profile.kycId ?? null,
        profile.kycReason ?? null,
        profile.identitySource ?? null,
        profile.pepScore ?? null,
        profile.documentAssetId ?? null,
        profile.accountOpenedAt ?? null,
        profile.kycSubmittedAt ?? null,
        profile.kycApprovedAt ?? null,
        activeJourneyId ?? null,
        profile.diditSessionId ?? null,
        profile.diditStatus ?? null,
      ],
    );
  }

  async appendTransitionIfMissing(transition: OnboardingTransition): Promise<void> {
    const exists = await this.pool.query(
      `SELECT 1 FROM channel_experience.onboarding_transitions WHERE id = $1`,
      [transition.id],
    );
    if ((exists.rowCount ?? 0) > 0) {
      return;
    }
    await this.pool.query(
      `INSERT INTO channel_experience.onboarding_transitions
         (id, journey_id, previous_state, new_state, command, actor, channel,
          correlation_id, version, created_at)
       VALUES ($1, $2, $3::channel_experience.journey_state,
               $4::channel_experience.journey_state, $5, $6,
               $7::channel_experience.channel_kind, $8, $9, $10::timestamptz)`,
      [
        transition.id,
        transition.journeyId,
        toPgState(transition.previousState),
        toPgState(transition.newState),
        transition.command,
        transition.actor,
        transition.channel,
        transition.correlationId,
        transition.version,
        transition.createdAt,
      ],
    );
  }

  async journeyExists(journeyId: string): Promise<boolean> {
    const row = await this.pool.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM channel_experience.onboarding_journeys WHERE journey_id = $1
       ) AS exists`,
      [journeyId],
    );
    return Boolean(row.rows[0]?.exists);
  }

  private async findCustomerId(externalRef: string): Promise<string | null> {
    const res = await this.pool.query<{ id: string }>(
      `SELECT id FROM channel_experience.customers WHERE external_ref = $1`,
      [externalRef],
    );
    return res.rows[0]?.id ?? null;
  }

  private async ensureCustomerId(externalRef: string): Promise<string> {
    const existing = await this.findCustomerId(externalRef);
    if (existing) {
      return existing;
    }
    const res = await this.pool.query<{ id: string }>(
      `INSERT INTO channel_experience.customers
         (external_ref, document_hash, display_name, email, phone, birth_date)
       VALUES ($1, $2, $3, $4, $5, '2000-01-01')
       ON CONFLICT (external_ref) DO UPDATE SET updated_at = now()
       RETURNING id`,
      [
        externalRef,
        hashDocument(externalRef),
        'Cliente',
        `${externalRef}@homolog.local`,
        '00000000000',
      ],
    );
    return res.rows[0].id;
  }
}