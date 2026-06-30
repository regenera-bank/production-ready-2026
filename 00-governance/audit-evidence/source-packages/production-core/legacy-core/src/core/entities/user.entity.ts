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
  OneToMany,
} from 'typeorm';
import { AccountEntity } from './account.entity';

@Entity('users')
@Index(['neuralId'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'neural_id', unique: true, length: 50 })
  neuralId: string; // e.g. 'DOW-PAULO-AGI-01' or 'RG-2098233287'

  @Column({ unique: true })
  email: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ default: 'Plus' })
  tier: string; // Plus, Premium, Metal, Enterprise, Ultra

  @Column({ default: 'active' })
  status: string; // active, locked, pending_kyc

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => AccountEntity, (account) => account.user)
  accounts: AccountEntity[];
}
