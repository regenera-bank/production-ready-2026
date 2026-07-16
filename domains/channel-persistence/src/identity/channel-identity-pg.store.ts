import { createHash } from 'crypto';
import { Pool } from 'pg';
import type {
  IdentitySnapshot,
  SessionRecord,
  UserRecord,
} from './channel-identity.types';
import { emptyIdentitySnapshot } from './channel-identity.types';

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const hashDocument = (document: string): string =>
  createHash('sha256')
    .update(document.replace(/\D/g, '').slice(-11))
    .digest('hex');

/** pg DATE chega como Date no driver — contrato do canal exige string AAAA-MM-DD. */
const normalizePgDate = (value: string | Date | null | undefined): string | undefined => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
};

/**
 * Projeção PG da fatia de identidade — cutover fase 1.
 * Leitura inicial + write-through em customers/sessions.
 */
export class ChannelIdentityPgStore {
  constructor(private readonly pool: Pool) {}

  async loadSnapshot(): Promise<IdentitySnapshot> {
    const snapshot = emptyIdentitySnapshot();
    const customers = await this.pool.query<{
      id: string;
      external_ref: string;
      document_hash: string;
      display_name: string;
      email: string;
      phone: string;
      birth_date: string | Date | null;
    }>(
      `SELECT id, external_ref, document_hash, display_name, email, phone, birth_date
       FROM channel_experience.customers`,
    );

    for (const row of customers.rows) {
      const user: UserRecord = {
        userId: row.external_ref,
        document: row.external_ref,
        password: '',
        displayName: row.display_name,
        email: row.email,
        phone: row.phone,
        birthDate: normalizePgDate(row.birth_date),
        address: {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          postalCode: '',
        },
        createdAt: new Date().toISOString(),
      };
      snapshot.users[row.external_ref] = user;
    }

    const sessions = await this.pool.query<{
      access_token_hash: string;
      customer_id: string;
      expires_at: Date;
    }>(
      `SELECT s.access_token_hash, c.external_ref AS customer_id, s.expires_at
       FROM channel_experience.sessions s
       JOIN channel_experience.customers c ON c.id = s.customer_id
       WHERE s.revoked_at IS NULL`,
    );

    for (const row of sessions.rows) {
      const user = snapshot.users[row.customer_id];
      if (!user) {
        continue;
      }
      const session: SessionRecord = {
        accessToken: `pg-${row.access_token_hash.slice(0, 32)}`,
        userId: row.customer_id,
        displayName: user.displayName,
        expiresAt: row.expires_at.toISOString(),
      };
      snapshot.sessions[session.accessToken] = session;
    }

    return snapshot;
  }

  async upsertUser(user: UserRecord): Promise<void> {
    const docHash = hashDocument(user.document || user.userId);
    await this.pool.query(
      `INSERT INTO channel_experience.customers
         (external_ref, document_hash, display_name, email, phone, birth_date)
       VALUES ($1, $2, $3, $4, $5, $6::date)
       ON CONFLICT (external_ref) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         birth_date = EXCLUDED.birth_date,
         updated_at = now()`,
      [
        user.userId,
        docHash,
        user.displayName,
        user.email,
        user.phone,
        user.birthDate ?? null,
      ],
    );

    if (user.password) {
      const customer = await this.pool.query<{ id: string }>(
        `SELECT id FROM channel_experience.customers WHERE external_ref = $1`,
        [user.userId],
      );
      const customerId = customer.rows[0]?.id;
      if (customerId) {
        await this.pool.query(
          `INSERT INTO channel_experience.customer_credentials
             (customer_id, credential_type, credential_ref)
           VALUES ($1, 'password_hash', $2)
           ON CONFLICT (customer_id, credential_type, credential_ref) DO NOTHING`,
          [customerId, user.password],
        );
      }
    }
  }

  async persistSession(
    session: SessionRecord,
    channel: 'WEB' | 'ANDROID' | 'IOS' | 'DESKTOP' | 'PWA' = 'WEB',
    deviceFingerprint?: string,
  ): Promise<void> {
    const customer = await this.pool.query<{ id: string }>(
      `SELECT id FROM channel_experience.customers WHERE external_ref = $1`,
      [session.userId],
    );
    const customerId = customer.rows[0]?.id;
    if (!customerId) {
      return;
    }
    let deviceId: string | null = null;
    if (deviceFingerprint) {
      const device = await this.pool.query<{ id: string }>(
        `INSERT INTO channel_experience.devices
           (customer_id, device_fingerprint, channel)
         VALUES ($1, $2, $3::channel_experience.channel_kind)
         ON CONFLICT (customer_id, device_fingerprint) DO UPDATE SET last_seen_at = now()
         RETURNING id`,
        [customerId, deviceFingerprint, channel],
      );
      deviceId = device.rows[0]?.id ?? null;
    }
    const tokenHash = hashToken(session.accessToken);
    const refreshHash = session.refreshToken
      ? hashToken(session.refreshToken)
      : null;
    await this.pool.query(
      `INSERT INTO channel_experience.sessions
         (customer_id, device_id, access_token_hash, refresh_token_hash, expires_at, correlation_id)
       VALUES ($1, $2::uuid, $3, $4, $5::timestamptz, $6)
       ON CONFLICT (access_token_hash) DO NOTHING`,
      [
        customerId,
        deviceId,
        tokenHash,
        refreshHash,
        session.expiresAt,
        `corr-${tokenHash.slice(0, 12)}`,
      ],
    );
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<{
    accessTokenHash: string;
    userId: string;
    displayName: string;
    expiresAt: string;
  } | undefined> {
    const refreshHash = hashToken(refreshToken);
    const row = await this.pool.query<{
      access_token_hash: string;
      external_ref: string;
      display_name: string;
      expires_at: Date;
    }>(
      `SELECT s.access_token_hash, c.external_ref, c.display_name, s.expires_at
       FROM channel_experience.sessions s
       JOIN channel_experience.customers c ON c.id = s.customer_id
       WHERE s.refresh_token_hash = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > now()
       LIMIT 1`,
      [refreshHash],
    );
    const session = row.rows[0];
    if (!session) {
      return undefined;
    }
    return {
      accessTokenHash: session.access_token_hash,
      userId: session.external_ref,
      displayName: session.display_name,
      expiresAt: session.expires_at.toISOString(),
    };
  }

  async rotateSessionTokens(
    oldAccessToken: string,
    next: SessionRecord,
  ): Promise<void> {
    const oldHash = hashToken(oldAccessToken);
    const nextAccessHash = hashToken(next.accessToken);
    const nextRefreshHash = next.refreshToken ? hashToken(next.refreshToken) : null;
    await this.pool.query(
      `UPDATE channel_experience.sessions
       SET access_token_hash = $2,
           refresh_token_hash = $3,
           expires_at = $4::timestamptz,
           revoked_at = NULL
       WHERE access_token_hash = $1`,
      [oldHash, nextAccessHash, nextRefreshHash, next.expiresAt],
    );
  }

  async revokeSession(accessToken: string): Promise<void> {
    const tokenHash = hashToken(accessToken);
    await this.pool.query(
      `UPDATE channel_experience.sessions SET revoked_at = now()
       WHERE access_token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    );
  }

  async customerExists(externalRef: string): Promise<boolean> {
    const row = await this.pool.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM channel_experience.customers WHERE external_ref = $1
       ) AS exists`,
      [externalRef],
    );
    return Boolean(row.rows[0]?.exists);
  }

  async findUserWithPassword(externalRef: string): Promise<UserRecord | undefined> {
    const customer = await this.pool.query<{
      external_ref: string;
      display_name: string;
      email: string;
      phone: string;
      birth_date: string | Date | null;
      password_hash: string | null;
    }>(
      `SELECT c.external_ref, c.display_name, c.email, c.phone, c.birth_date,
              cc.credential_ref AS password_hash
       FROM channel_experience.customers c
       LEFT JOIN channel_experience.customer_credentials cc
         ON cc.customer_id = c.id
        AND cc.credential_type = 'password_hash'
       WHERE c.external_ref = $1
       LIMIT 1`,
      [externalRef],
    );
    const row = customer.rows[0];
    if (!row) {
      return undefined;
    }
    return {
      userId: row.external_ref,
      document: row.external_ref,
      password: row.password_hash ?? '',
      displayName: row.display_name,
      email: row.email,
      phone: row.phone,
      birthDate: normalizePgDate(row.birth_date),
      address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        postalCode: '',
      },
      createdAt: new Date().toISOString(),
    };
  }

  async findSessionByToken(accessToken: string): Promise<SessionRecord | undefined> {
    const tokenHash = hashToken(accessToken);
    const row = await this.pool.query<{
      external_ref: string;
      display_name: string;
      expires_at: Date;
    }>(
      `SELECT c.external_ref, c.display_name, s.expires_at
       FROM channel_experience.sessions s
       JOIN channel_experience.customers c ON c.id = s.customer_id
       WHERE s.access_token_hash = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > now()
       LIMIT 1`,
      [tokenHash],
    );
    const session = row.rows[0];
    if (!session) {
      return undefined;
    }
    return {
      accessToken,
      userId: session.external_ref,
      displayName: session.display_name,
      expiresAt: session.expires_at.toISOString(),
    };
  }
}