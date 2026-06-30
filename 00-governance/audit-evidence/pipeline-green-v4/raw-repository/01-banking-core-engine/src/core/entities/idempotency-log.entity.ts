/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type { ColumnType } from 'typeorm';

const databaseUrl = process.env.DATABASE_URL ?? '';

const isPostgresRuntime =
  process.env.DB_TYPE === 'postgres' || /^postgres(ql)?:\/\//.test(databaseUrl);

const isSqliteRuntime =
  process.env.DB_TYPE === 'sqlite' ||
  (!isPostgresRuntime && process.env.NODE_ENV === 'test');

const timestampColumnType: ColumnType = isSqliteRuntime
  ? 'datetime'
  : 'timestamptz';

@Entity('idempotency_logs')
export class IdempotencyLogEntity {
  @PrimaryColumn()
  key: string; // The Idempotency-Key header or generated UUID

  @Column()
  @Index()
  userId: string; // neuralId from Firebase JWT

  @Column()
  endpoint: string;

  @Column({ type: 'simple-json', nullable: true })
  responseBody: any;

  @Column({ nullable: true })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'expires_at',
    type: timestampColumnType,
  })
  @Index()
  expiresAt: Date;
}
