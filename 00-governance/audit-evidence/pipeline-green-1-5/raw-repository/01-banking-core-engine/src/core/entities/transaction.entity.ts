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
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AccountEntity } from './account.entity';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AccountEntity, { eager: false })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column('integer', { name: 'amount_cents' })
  amountCents: number;

  @Column()
  type: string; // PIX_IN, PIX_OUT, TRANSFER_IN, TRANSFER_OUT, etc.

  @Column({ default: 'COMPLETED' })
  status: string;

  @Column({ name: 'counterparty_name', nullable: true })
  counterpartyName?: string;

  @Column({ name: 'counterparty_key', nullable: true })
  counterpartyKey?: string;

  @Column({ name: 'end_to_end_id', nullable: true })
  endToEndId?: string;

  @Column({ name: 'idempotency_key', nullable: true, unique: true })
  idempotencyKey?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'previous_hash', nullable: true })
  previousHash?: string; // SHA-256 da transação anterior da mesma conta

  @Column({ name: 'hash', unique: true, nullable: true })
  hash?: string; // SHA-256(previousHash + accountId + amountCents + type + idempotencyKey + createdAt)

  @Column('integer', { name: 'balance_after_cents', nullable: true })
  balanceAfterCents?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
