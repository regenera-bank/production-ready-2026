/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Transaction Entity
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/transaction-service/src/transaction/transaction.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Money } from '@repo/core';

export enum TransactionType {
  PIX = 'PIX',
  TED = 'TED',
  DOC = 'DOC',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  INVESTMENT_BUY = 'INVESTMENT_BUY',
  INVESTMENT_SELL = 'INVESTMENT_SELL',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
  SETTLED = 'SETTLED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string; // User initiating or involved

  @Column({ type: 'uuid' })
  sourceAccountId: string;

  @Column({ type: 'uuid' })
  destinationAccountId: string;

  @Column('bigint')
  amountInCents: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ nullable: true })
  externalTransactionId: string; // e.g., SPI transaction ID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}