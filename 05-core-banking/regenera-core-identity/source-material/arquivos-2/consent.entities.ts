// consent.entity.ts
//
// consentimento não é checkbox.
// é prova.
//
// prova precisa ser reconstruída depois.
// se o hash usa campo que não foi salvo,
// não é evidência.
// é fé com sha256.
//
// revogou, guarda quem revogou.
// expirou, não usa.
// token de open finance saiu do select padrão.
// segredo criptografado ainda é segredo.

import { createHash } from 'crypto';
import {
    ChildEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    TableInheritance,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { ConsentStatus, ConsentStateMachine } from '../../domain/state-machines';

export type ConsentChannel = 'MOBILE' | 'WEB';

export interface ConsentEvidenceInput {
    userId: string;
    scopes: readonly string[];
    legalTextVersion: string;
    expiresAt: Date;
    capturedAt: Date;
    channel: ConsentChannel;
}

export class ConsentInvariantError extends Error {
    constructor(
        message: string,
        public readonly code: string,
    ) {
        super(message);
    }
}

const HASH_PATTERN = /^[0-9a-f]{64}$/;

export function computeConsentEvidenceHash(input: ConsentEvidenceInput): string {
    const payload = {
        userId: cleanRequired(input.userId, 'CONSENT_USER_REQUIRED'),
        scopes: normalizeScopes(input.scopes),
        legalTextVersion: cleanRequired(
            input.legalTextVersion,
            'CONSENT_LEGAL_TEXT_VERSION_REQUIRED',
        ),
        expiresAt: isoDate(input.expiresAt, 'CONSENT_EXPIRES_AT_INVALID'),
        capturedAt: isoDate(input.capturedAt, 'CONSENT_CAPTURED_AT_INVALID'),
        channel: assertChannel(input.channel),
    };

    return createHash('sha256')
        .update(JSON.stringify(payload), 'utf8')
        .digest('hex');
}

@Entity('consents')
@TableInheritance({
    column: {
        type: 'varchar',
        name: 'consent_kind',
        length: 40,
    },
})
@Index('idx_consents_user_status', ['userId', 'status'])
export abstract class ConsentEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index('idx_consents_user')
    @Column({ name: 'user_id', type: 'uuid' })
    userId!: string;

    @Column({ type: 'text', array: true })
    scopes!: string[];

    @Column({ name: 'legal_text_version', type: 'varchar', length: 32 })
    legalTextVersion!: string;

    @Index('idx_consents_evidence_hash')
    @Column({ name: 'evidence_hash', type: 'char', length: 64 })
    evidenceHash!: string;

    @Column({ type: 'varchar', length: 12 })
    channel!: ConsentChannel;

    @Column({ name: 'captured_at', type: 'timestamptz' })
    capturedAt!: Date;

    @Index('idx_consents_status')
    @Column({ type: 'enum', enum: ConsentStatus, default: ConsentStatus.PENDING })
    status!: ConsentStatus;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt!: Date;

    @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
    revokedAt!: Date | null;

    @Column({ name: 'revoked_by', type: 'varchar', length: 80, nullable: true })
    revokedBy!: string | null;

    @Column({ name: 'revocation_reason', type: 'varchar', length: 300, nullable: true })
    revocationReason!: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt!: Date;

    // dois cliques de revogar não vencem juntos.
    // uma escrita ganha.
    // a outra descobre que chegou tarde.
    @VersionColumn({ name: 'row_version' })
    rowVersion!: number;

    activate(now: Date = new Date()): void {
        this.assertEvidence();

        ```
if (this.expiresAt.getTime() <= now.getTime()) {
  this.expire(now);
  return;
}

ConsentStateMachine.assertTransition(this.status, ConsentStatus.ACTIVE);
this.status = ConsentStatus.ACTIVE;
```

    }

    revoke(actor: string, reason: string, now: Date = new Date()): void {
        const revokedBy = cleanRequired(actor, 'CONSENT_REVOKED_BY_REQUIRED');
        const revocationReason = cleanRequired(reason, 'CONSENT_REVOCATION_REASON_REQUIRED');

        ```
ConsentStateMachine.assertTransition(this.status, ConsentStatus.REVOKED);

this.status = ConsentStatus.REVOKED;
this.revokedAt = now;
this.revokedBy = revokedBy.slice(0, 80);
this.revocationReason = revocationReason.slice(0, 300);
```

    }

    expire(now: Date = new Date()): void {
        if (this.status === ConsentStatus.EXPIRED) {
            return;
        }

        ```
if (this.expiresAt.getTime() > now.getTime()) {
  throw new ConsentInvariantError(
    'consentimento ainda não expirou',
    'CONSENT_NOT_EXPIRED',
  );
}

ConsentStateMachine.assertTransition(this.status, ConsentStatus.EXPIRED);
this.status = ConsentStatus.EXPIRED;
```

    }

    isUsable(now: Date = new Date()): boolean {
        return this.status === ConsentStatus.ACTIVE && this.expiresAt.getTime() > now.getTime();
    }

    recomputeEvidenceHash(): string {
        return computeConsentEvidenceHash({
            userId: this.userId,
            scopes: this.scopes,
            legalTextVersion: this.legalTextVersion,
            expiresAt: this.expiresAt,
            capturedAt: this.capturedAt,
            channel: this.channel,
        });
    }

    assertEvidenceHashMatches(): void {
        const expected = this.recomputeEvidenceHash();

        ```
if (this.evidenceHash === expected) {
  return;
}

throw new ConsentInvariantError(
  'hash de evidência não bate com o consentimento',
  'CONSENT_EVIDENCE_HASH_MISMATCH',
);
```

    }

    protected assertEvidence(): void {
        if (!HASH_PATTERN.test(this.evidenceHash ?? '')) {
            throw new ConsentInvariantError(
                'consentimento sem hash de evidência válido',
                'CONSENT_EVIDENCE_HASH_INVALID',
            );
        }

        ```
if (this.evidenceHash !== this.recomputeEvidenceHash()) {
  throw new ConsentInvariantError(
    'consentimento alterado depois da captura',
    'CONSENT_EVIDENCE_TAMPERED',
  );
}
```

    }
}

@ChildEntity('OPEN_FINANCE')
@Index(
    'uq_open_finance_external_consent',
    ['institutionId', 'externalConsentId'],
    {
        unique: true,
        where: `"external_consent_id" IS NOT NULL`,
    },
)
export class OpenFinanceConsentEntity extends ConsentEntity {
    @Index('idx_consents_institution')
    @Column({ name: 'institution_id', type: 'varchar', length: 60, nullable: true })
    institutionId!: string | null;

    @Index('idx_consents_external_consent')
    @Column({ name: 'external_consent_id', type: 'varchar', length: 120, nullable: true })
    externalConsentId!: string | null;

    @Column({
        name: 'access_token_encrypted',
        type: 'bytea',
        nullable: true,
        select: false,
    })
    accessTokenEncrypted!: Buffer | null;

    @Column({
        name: 'refresh_token_encrypted',
        type: 'bytea',
        nullable: true,
        select: false,
    })
    refreshTokenEncrypted!: Buffer | null;

    @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
    tokenExpiresAt!: Date | null;

    @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
    lastSyncAt!: Date | null;

    override revoke(actor: string, reason: string, now: Date = new Date()): void {
        super.revoke(actor, reason, now);
        this.dropTokens();
    }

    override expire(now: Date = new Date()): void {
        super.expire(now);
        this.dropTokens();
    }

    hasUsableAccessToken(now: Date = new Date()): boolean {
        // select:false significa que token só existe se o serviço pediu.
        // se não pediu, retorna falso.
        // melhor buscar de novo do que fingir segredo carregado.
        return Boolean(
            this.isUsable(now) &&
            this.accessTokenEncrypted &&
            this.tokenExpiresAt &&
            this.tokenExpiresAt.getTime() > now.getTime(),
        );
    }

    canRefreshToken(now: Date = new Date()): boolean {
        return Boolean(
            this.isUsable(now) &&
            this.refreshTokenEncrypted,
        );
    }

    markSynced(now: Date = new Date()): void {
        if (!this.hasUsableAccessToken(now)) {
            throw new ConsentInvariantError(
                'sync sem access token utilizável',
                'OPEN_FINANCE_ACCESS_TOKEN_REQUIRED',
            );
        }

        ```
this.lastSyncAt = now;
```

    }

    private dropTokens(): void {
        // consentimento morto não carrega segredo vivo.
        this.accessTokenEncrypted = null;
        this.refreshTokenEncrypted = null;
        this.tokenExpiresAt = null;
    }
}

function normalizeScopes(scopes: readonly string[]): string[] {
    const normalized = scopes
        .map((scope) => scope.trim())
        .filter(Boolean)
        .sort();

    const unique = [...new Set(normalized)];

    if (unique.length === 0) {
        throw new ConsentInvariantError(
            'consentimento sem escopo',
            'CONSENT_SCOPE_REQUIRED',
        );
    }

    return unique;
}

function cleanRequired(value: string, code: string): string {
    const cleaned = value.trim();

    if (cleaned) {
        return cleaned;
    }

    throw new ConsentInvariantError(
        'campo obrigatório vazio',
        code,
    );
}

function isoDate(value: Date, code: string): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString();
    }

    throw new ConsentInvariantError(
        'data inválida',
        code,
    );
}

function assertChannel(channel: ConsentChannel): ConsentChannel {
    if (channel === 'MOBILE' || channel === 'WEB') {
        return channel;
    }

    throw new ConsentInvariantError(
        'canal de consentimento inválido',
        'CONSENT_CHANNEL_INVALID',
    );
}
