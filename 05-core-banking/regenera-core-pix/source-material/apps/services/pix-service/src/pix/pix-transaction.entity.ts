/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Transaction Entity
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/pix-transaction.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pix_transactions')
export class PixTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceAccountId: string;

  @Column()
  destinationAccountId: string;

  @Column('bigint')
  amountInCents: number;

  @CreateDateColumn()
  completedAt: Date;
}
