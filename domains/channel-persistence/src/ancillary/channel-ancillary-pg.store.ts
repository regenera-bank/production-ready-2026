import { Pool } from 'pg';
import type {
  AncillarySnapshot,
  ConsentChannel,
  ConsentRecord,
  ConsentType,
  StoredPasskeyRecord,
} from './channel-ancillary.types';
import { emptyAncillarySnapshot } from './channel-ancillary.types';

const channelToPg = (channel: ConsentChannel): string =>
  channel === 'pwa' ? 'PWA' : channel.toUpperCase();

const channelFromPg = (value: string): ConsentChannel => {
  const normalized = value.toLowerCase();
  if (normalized === 'android' || normalized === 'ios' || normalized === 'pwa') {
    return normalized;
  }
  return 'web';
};

export class ChannelAncillaryPgStore {
  constructor(private readonly pool: Pool) {}

  async loadSnapshot(): Promise<AncillarySnapshot> {
    const snapshot = emptyAncillarySnapshot();

    const consents = await this.pool.query<{
      id: string;
      external_ref: string;
      consent_type: ConsentType;
      version: string;
      channel: string;
      accepted_at: Date;
      revoked_at: Date | null;
    }>(
      `SELECT cc.id, c.external_ref, cc.consent_type, cc.version, cc.channel::text,
              cc.accepted_at, cc.revoked_at
       FROM channel_experience.customer_consents cc
       JOIN channel_experience.customers c ON c.id = cc.customer_id`,
    );
    for (const row of consents.rows) {
      const record: ConsentRecord = {
        id: row.id,
        userId: row.external_ref,
        type: row.consent_type,
        version: row.version,
        acceptedAt: row.accepted_at.toISOString(),
        channel: channelFromPg(row.channel),
        ...(row.revoked_at ? { revokedAt: row.revoked_at.toISOString() } : {}),
      };
      const list = snapshot.consents[row.external_ref] ?? [];
      list.push(record);
      snapshot.consents[row.external_ref] = list;
    }

    const passkeys = await this.pool.query<{
      external_ref: string;
      credential_id: string;
      public_key_b64: string;
      counter: string;
      transports: string[] | null;
    }>(
      `SELECT c.external_ref, p.credential_id, p.public_key_b64, p.counter::text, p.transports
       FROM channel_experience.passkey_credentials p
       JOIN channel_experience.customers c ON c.id = p.customer_id
       WHERE p.revoked_at IS NULL`,
    );
    for (const row of passkeys.rows) {
      const record: StoredPasskeyRecord = {
        credentialId: row.credential_id,
        publicKeyBase64: row.public_key_b64,
        counter: Number(row.counter),
        transports: row.transports ?? undefined,
      };
      const list = snapshot.passkeys[row.external_ref] ?? [];
      list.push(record);
      snapshot.passkeys[row.external_ref] = list;
    }

    const integration = await this.pool.query<{
      domain: string;
      record_key: string;
      payload: Record<string, unknown>;
    }>(`SELECT domain, record_key, payload FROM channel_experience.integration_records`);

    for (const row of integration.rows) {
      if (row.domain === 'prometeo_payment') {
        snapshot.prometeoPayments[row.record_key] = row.payload;
      } else if (row.domain === 'prometeo_event') {
        snapshot.prometeoProcessedEventIds[row.record_key] = String(
          row.payload.eventId ?? row.record_key,
        );
      }
    }

    return snapshot;
  }

  async resolveCustomerId(externalRef: string): Promise<string | undefined> {
    const row = await this.pool.query<{ id: string }>(
      `SELECT id FROM channel_experience.customers WHERE external_ref = $1 LIMIT 1`,
      [externalRef],
    );
    return row.rows[0]?.id;
  }

  async insertConsent(
    userId: string,
    record: ConsentRecord,
  ): Promise<void> {
    const customerId = await this.resolveCustomerId(userId);
    if (!customerId) {
      return;
    }
    await this.pool.query(
      `UPDATE channel_experience.customer_consents
       SET revoked_at = $3::timestamptz
       WHERE customer_id = $1::uuid
         AND consent_type = $2
         AND revoked_at IS NULL`,
      [customerId, record.type, record.acceptedAt],
    );
    await this.pool.query(
      `INSERT INTO channel_experience.customer_consents
         (id, customer_id, consent_type, version, channel, accepted_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5::channel_experience.channel_kind, $6::timestamptz)`,
      [
        record.id,
        customerId,
        record.type,
        record.version,
        channelToPg(record.channel),
        record.acceptedAt,
      ],
    );
  }

  async revokeConsent(userId: string, type: ConsentType, revokedAt: string): Promise<void> {
    const customerId = await this.resolveCustomerId(userId);
    if (!customerId) {
      return;
    }
    await this.pool.query(
      `UPDATE channel_experience.customer_consents
       SET revoked_at = $3::timestamptz
       WHERE customer_id = $1::uuid AND consent_type = $2 AND revoked_at IS NULL`,
      [customerId, type, revokedAt],
    );
  }

  async upsertPasskey(userId: string, record: StoredPasskeyRecord): Promise<void> {
    const customerId = await this.resolveCustomerId(userId);
    if (!customerId) {
      return;
    }
    await this.pool.query(
      `INSERT INTO channel_experience.passkey_credentials
         (customer_id, credential_id, public_key_b64, counter, transports)
       VALUES ($1::uuid, $2, $3, $4, $5)
       ON CONFLICT (credential_id) DO UPDATE SET
         counter = EXCLUDED.counter,
         public_key_b64 = EXCLUDED.public_key_b64,
         transports = EXCLUDED.transports`,
      [
        customerId,
        record.credentialId,
        record.publicKeyBase64,
        record.counter,
        record.transports ?? null,
      ],
    );
  }

  async updatePasskeyCounter(credentialId: string, counter: number): Promise<void> {
    await this.pool.query(
      `UPDATE channel_experience.passkey_credentials SET counter = $2 WHERE credential_id = $1`,
      [credentialId, counter],
    );
  }

  async putIntegrationRecord(
    domain: string,
    recordKey: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO channel_experience.integration_records (domain, record_key, payload)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (domain, record_key) DO UPDATE SET
         payload = EXCLUDED.payload,
         updated_at = now()`,
      [domain, recordKey, JSON.stringify(payload)],
    );
  }

  async appendSandboxAudit(entry: {
    domain: 'lifestyle' | 'products' | 'prometeo';
    userId: string;
    moduleId?: string;
    action: string;
    referenceId: string;
    status: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    const customerId = await this.resolveCustomerId(entry.userId);
    await this.pool.query(
      `INSERT INTO channel_experience.sandbox_Audit_events
         (domain, customer_id, external_ref, module_id, action, reference_id, status, payload)
       VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        entry.domain,
        customerId ?? null,
        entry.userId,
        entry.moduleId ?? null,
        entry.action,
        entry.referenceId,
        entry.status,
        entry.payload ? JSON.stringify(entry.payload) : null,
      ],
    );
  }
}