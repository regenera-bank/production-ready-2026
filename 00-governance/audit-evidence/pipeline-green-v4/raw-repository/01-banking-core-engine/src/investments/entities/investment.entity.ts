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
} from 'typeorm';

@Entity('custody')
@Index(['neural_id', 'symbol'], { unique: true })
export class InvestmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Matches schema (user_id preferred long-term; neural_id for current Firebase-driven code)
  @Column({ name: 'neural_id' })
  neural_id: string;

  @Column()
  symbol: string;

  @Column({ name: 'asset_type', nullable: true })
  asset_type?: string; // STOCK | CRYPTO | ETF

  @Column('decimal', { precision: 20, scale: 8 })
  quantity: number;

  @Column('decimal', { precision: 19, scale: 4, name: 'average_price' })
  avg_price: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
