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
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('accounts')
@Index(['neuralId'], { unique: true })
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // For backward compat with existing code using neuralId as key (Firebase users)
  @Column({ name: 'neural_id', unique: true })
  neuralId: string; // e.g. 'RG-2098233287' or 'DOW-PAULO-AGI-01'

  // Optional FK to users table (from official schema). Code can create User on first use.
  @ManyToOne(() => UserEntity, (user) => user.accounts, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ default: '0001' })
  agency: string;

  @Column({ name: 'account_number', unique: true })
  accountNumber: string;

  @Column('bigint', { name: 'balance_cents', default: 0 })
  balanceCents: number;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ type: 'varchar', length: 32, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
