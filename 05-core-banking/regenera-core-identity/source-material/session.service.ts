// session.service.ts
//
// refresh token não entra no banco em claro.
// só hash.
//
// se o banco vazar, token não vira sessão pronta.
//
// rotação existe porque refresh token usado não volta.
// se token velho aparece de novo, alguém copiou.
// não revoga uma sessão.
// derruba a família inteira.
//
// segurança que só fecha uma aba deixa o ladrão na outra.

import { createHash, randomBytes } from 'crypto';
import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { MetricsService } from '../metrics/metrics.service';

export const SESSION_CONFIG_TOKEN = 'SessionConfig';

const REFRESH_COOKIE_NAME = '__Host-rb_refresh';
const REFRESH_COOKIE_PATH = '/v1/auth/refresh';

type Platform = 'WEB' | 'IOS' | 'ANDROID';
type SessionStatus = 'ACTIVE' | 'ROTATED' | 'REVOKED' | 'EXPIRED';
type CloseReason =
  | 'ROTATION'
  | 'REPLAY_DETECTED'
  | 'TTL'
  | 'SESSION_CAP'
  | 'USER_LOGOUT';

export interface SessionConfig {
  refreshTtlSeconds: number;
  stepUpTtlSeconds: number;
  maxActiveSessionsPerUser: number;
  ipHashSecret: string;
}

export interface IssuedSession {
  sessionId: string;
  familyId: string;
  refreshToken: string;
  cookie: {
    name: typeof REFRESH_COOKIE_NAME;
    value: string;
    httpOnly: true;
    secure: true;
    sameSite: 'strict';
    path: typeof REFRESH_COOKIE_PATH;
    maxAge: number;
  };
}

interface OpenSessionInput {
  userId: string;
  fingerprint: string;
  platform: Platform;
  deviceName: string;
  ip: string;
  userAgent: string;
}

interface AuthSessionRow {
  id: string;
  user_id: string;
  device_id: string;
  family_id: string;
  status: SessionStatus;
  expires_at: Date | string;
  user_agent: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly metrics: MetricsService,
    @Inject(SESSION_CONFIG_TOKEN)
    private readonly config: SessionConfig,
  ) {
    assertConfig(config);
  }

  async open(input: OpenSessionInput): Promise<IssuedSession> {
    const runner = this.dataSource.createQueryRunner();

    ```
await runner.connect();
await runner.startTransaction();

try {
  const ipHash = this.hashIp(input.ip);
  const deviceId = await this.upsertDevice(runner, input);

  // corta sessões antigas antes de criar a nova.
  // se criar primeiro, o corte pode matar o token que acabou de nascer.
  await this.enforceSessionCap(runner, input.userId);

  const refreshToken = generateRefreshToken();
  const familyId = await randomUuid(runner);

  const [session]: Array<{ id: string }> = await runner.query(
    `INSERT INTO auth_sessions
      (user_id, device_id, family_id, refresh_token_hash, ip_hash, user_agent, expires_at)
    VALUES($1, $2, $3, $4, $5, $6, now() + ($7 || ' seconds'):: interval)
     RETURNING id`,
    [
      input.userId,
      deviceId,
      familyId,
      this.hashToken(refreshToken),
      ipHash,
      clamp(input.userAgent, 300),
      String(this.config.refreshTtlSeconds),
    ],
  );

  await this.audit(runner, {
    userId: input.userId,
    deviceId,
    sessionId: session.id,
    eventType: 'LOGIN_SUCCESS',
    ipHash,
    detail: {
      platform: input.platform,
    },
  });

  await runner.commitTransaction();

  this.metrics.increment('auth_session_opened_total', {
    platform: input.platform,
  });

  return this.issued(session.id, familyId, refreshToken);
} catch (error: unknown) {
  await rollbackQuietly(runner);
  throw error;
} finally {
  await runner.release();
}
```

  }

  async rotate(presentedToken: string, ip: string): Promise<IssuedSession> {
    const runner = this.dataSource.createQueryRunner();

    ```
await runner.connect();
await runner.startTransaction();

try {
  const tokenHash = this.hashToken(presentedToken);
  const ipHash = this.hashIp(ip);

  const rows: AuthSessionRow[] = await runner.query(
    `SELECT id, user_id, device_id, family_id, status, expires_at, user_agent
       FROM auth_sessions
      WHERE refresh_token_hash = $1
      FOR UPDATE`,
    [tokenHash],
  );

  const session = rows[0];

  if (!session) {
    // token que não existe não altera banco.
    // não tem por que commitar nada.
    throw new UnauthorizedException({
      code: 'SESSION_INVALID',
    });
  }

  if (session.status !== 'ACTIVE') {
    // token rotacionado reapareceu.
    // isso é replay.
    // replay de refresh token é roubo até prova contrária.
    await this.revokeFamily(runner, session.family_id, 'REPLAY_DETECTED');

    await this.audit(runner, {
      userId: session.user_id,
      deviceId: session.device_id,
      sessionId: session.id,
      eventType: 'REFRESH_REPLAY_DETECTED',
      ipHash,
      detail: {
        familyId: session.family_id,
        previousStatus: session.status,
      },
    });

    await runner.commitTransaction();

    this.metrics.increment('account_lockdown_total', {
      reason: 'refresh_replay',
    });

    throw new ForbiddenException({
      code: 'SESSION_FAMILY_REVOKED',
    });
  }

  if (isExpired(session.expires_at)) {
    await this.closeSession(runner, session.id, 'EXPIRED', 'TTL');

    await runner.commitTransaction();

    throw new UnauthorizedException({
      code: 'SESSION_EXPIRED',
    });
  }

  const nextToken = generateRefreshToken();

  await this.closeSession(runner, session.id, 'ROTATED', 'ROTATION');

  const [next]: Array<{ id: string }> = await runner.query(
    `INSERT INTO auth_sessions
      (user_id, device_id, family_id, refresh_token_hash, parent_session_id,
        ip_hash, user_agent, expires_at)
    VALUES($1, $2, $3, $4, $5, $6, $7, now() + ($8 || ' seconds'):: interval)
     RETURNING id`,
    [
      session.user_id,
      session.device_id,
      session.family_id,
      this.hashToken(nextToken),
      session.id,
      ipHash,
      clamp(session.user_agent, 300),
      String(this.config.refreshTtlSeconds),
    ],
  );

  await this.audit(runner, {
    userId: session.user_id,
    deviceId: session.device_id,
    sessionId: next.id,
    eventType: 'REFRESH_ROTATED',
    ipHash,
    detail: {
      previousSessionId: session.id,
      familyId: session.family_id,
    },
  });

  await runner.commitTransaction();

  this.metrics.increment('auth_refresh_rotated_total', {});

  return this.issued(next.id, session.family_id, nextToken);
} catch (error: unknown) {
  await rollbackQuietly(runner);
  throw error;
} finally {
  await runner.release();
}
```

  }

  async validateActive(sessionId: string, userId: string): Promise<boolean> {
    const rows: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id
         FROM auth_sessions
        WHERE id = $1
          AND user_id = $2
          AND status = 'ACTIVE'
          AND expires_at > now()
        LIMIT 1`,
      [sessionId, userId],
    );

    ```
return rows.length === 1;
```

  }

  async revoke(sessionId: string, reason: CloseReason = 'USER_LOGOUT'): Promise<void> {
    const runner = this.dataSource.createQueryRunner();

    ```
await runner.connect();
await runner.startTransaction();

try {
  const rows: Array<{
    id: string;
    user_id: string;
    device_id: string;
    ip_hash: string;
  }> = await runner.query(
    `SELECT id, user_id, device_id, ip_hash
       FROM auth_sessions
      WHERE id = $1
        AND status = 'ACTIVE'
      FOR UPDATE`,
    [sessionId],
  );

  const session = rows[0];

  if (!session) {
    await runner.commitTransaction();
    return;
  }

  await this.closeSession(runner, session.id, 'REVOKED', reason);

  await this.audit(runner, {
    userId: session.user_id,
    deviceId: session.device_id,
    sessionId: session.id,
    eventType: 'SESSION_REVOKED',
    ipHash: session.ip_hash,
    detail: {
      reason,
    },
  });

  await runner.commitTransaction();

  this.metrics.increment('auth_session_revoked_total', {
    reason,
  });
} catch (error: unknown) {
  await rollbackQuietly(runner);
  throw error;
} finally {
  await runner.release();
}
```

  }

  private issued(sessionId: string, familyId: string, refreshToken: string): IssuedSession {
    return {
      sessionId,
      familyId,
      refreshToken,
      cookie: {
        name: REFRESH_COOKIE_NAME,
        value: refreshToken,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: REFRESH_COOKIE_PATH,
        maxAge: this.config.refreshTtlSeconds,
      },
    };
  }

  private async upsertDevice(
    runner: QueryRunner,
    input: OpenSessionInput,
  ): Promise<string> {
    const [device]: Array<{ id: string }> = await runner.query(
      `INSERT INTO auth_devices
         (user_id, fingerprint_hash, platform, display_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, fingerprint_hash)
       DO UPDATE
          SET last_seen_at = now()
       RETURNING id`,
      [
        input.userId,
        this.hashToken(input.fingerprint),
        input.platform,
        clamp(input.deviceName, 80),
      ],
    );

    ```
return device.id;
```

  }

  private async enforceSessionCap(runner: QueryRunner, userId: string): Promise<void> {
    // sessão ativa demais é estoque de token esquecido.
    // quando passa do teto, as mais antigas morrem.
    // token velho em notebook perdido não merece respirar.
    await runner.query(
      `UPDATE auth_sessions
          SET status = 'REVOKED',
              closed_at = now(),
              closed_reason = 'SESSION_CAP'
        WHERE id IN (
          SELECT id
            FROM auth_sessions
           WHERE user_id = $1
             AND status = 'ACTIVE'
           ORDER BY created_at DESC
          OFFSET $2
        )`,
      [userId, Math.max(this.config.maxActiveSessionsPerUser - 1, 0)],
    );
  }

  private async closeSession(
    runner: QueryRunner,
    sessionId: string,
    status: Exclude<SessionStatus, 'ACTIVE'>,
    reason: CloseReason,
  ): Promise<void> {
    await runner.query(
      `UPDATE auth_sessions
          SET status = $2,
              closed_at = now(),
              closed_reason = $3
        WHERE id = $1`,
      [sessionId, status, reason],
    );
  }

  private async revokeFamily(
    runner: QueryRunner,
    familyId: string,
    reason: CloseReason,
  ): Promise<void> {
    await runner.query(
      `UPDATE auth_sessions
          SET status = 'REVOKED',
              closed_at = now(),
              closed_reason = $2
        WHERE family_id = $1
          AND status = 'ACTIVE'`,
      [familyId, reason],
    );
  }

  private async audit(
    runner: QueryRunner,
    input: {
      userId: string;
      deviceId: string;
      sessionId: string;
      eventType:
      | 'LOGIN_SUCCESS'
      | 'REFRESH_ROTATED'
      | 'REFRESH_REPLAY_DETECTED'
      | 'SESSION_REVOKED';
      ipHash: string;
      detail: Record<string, unknown>;
    },
  ): Promise<void> {
    // sessão sem evento é segurança sem recibo.
    // quando der problema, a primeira pergunta vai ser:
    // quem entrou, de onde, e qual token girou.
    await runner.query(
      `INSERT INTO auth_events
         (user_id, device_id, session_id, event_type, ip_hash, detail)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        input.userId,
        input.deviceId,
        input.sessionId,
        input.eventType,
        input.ipHash,
        JSON.stringify(input.detail),
      ],
    );
  }

  private hashToken(value: string): string {
    return createHash('sha256')
      .update(value, 'utf8')
      .digest('hex');
  }

  private hashIp(ip: string): string {
    return createHash('sha256')
      .update(`${this.config.ipHashSecret}|${ip}`, 'utf8')
      .digest('hex');
  }
}

function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

function isExpired(value: Date | string): boolean {
  return new Date(value).getTime() <= Date.now();
}

function clamp(value: string, max: number): string {
  return value.slice(0, max);
}

function assertConfig(config: SessionConfig): void {
  if (!Number.isInteger(config.refreshTtlSeconds) || config.refreshTtlSeconds <= 0) {
    throw new Error('SessionConfig.refreshTtlSeconds inválido');
  }

  if (!Number.isInteger(config.stepUpTtlSeconds) || config.stepUpTtlSeconds <= 0) {
    throw new Error('SessionConfig.stepUpTtlSeconds inválido');
  }

  if (
    !Number.isInteger(config.maxActiveSessionsPerUser) ||
    config.maxActiveSessionsPerUser <= 0
  ) {
    throw new Error('SessionConfig.maxActiveSessionsPerUser inválido');
  }

  if (typeof config.ipHashSecret !== 'string' || config.ipHashSecret.length < 32) {
    throw new Error('SessionConfig.ipHashSecret fraco');
  }
}

async function randomUuid(runner: QueryRunner): Promise<string> {
  const [row]: Array<{ id: string }> = await runner.query(
    `SELECT gen_random_uuid() AS id`,
  );

  return row.id;
}

async function rollbackQuietly(runner: QueryRunner): Promise<void> {
  if (!runner.isTransactionActive) {
    return;
  }

  await runner.rollbackTransaction().catch(() => undefined);
}
