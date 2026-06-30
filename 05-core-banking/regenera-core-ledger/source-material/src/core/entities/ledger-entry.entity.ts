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
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW    |
|---------------------------------------------------------------------------------------|
*/

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AccountEntity } from './account.entity';

@Entity('ledger_entries')
export class LedgerEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AccountEntity, { eager: false })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Column({ name: 'account_id' })
  @Index()
  accountId: string;

  @Column('integer')
  amountCents: number; // Positive for CREDIT, Negative for DEBIT

  @Column()
  operation: string; // PIX_IN, PIX_OUT, TRANSFER, FEE

  @Column({ name: 'counterparty_data', nullable: true })
  counterpartyData?: string;

  @Column({ name: 'idempotency_key', nullable: true, unique: true })
  idempotencyKey?: string;

  @Column({ name: 'previous_hash', nullable: true })
  previousHash?: string; // Hash of the previous ledger entry for this account

  @Column({ name: 'hash', unique: true })
  hash: string; // SHA-256(previousHash + accountId + amountCents + operation + idempotencyKey + createdAt)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
