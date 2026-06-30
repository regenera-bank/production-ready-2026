/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Service - Saga Log Entity (Conceptual)
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/saga-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PixSagaStatus } from './saga-state.enum'; // Import the Saga Status Enum

/**
 * @description Represents a conceptual Saga Log entity to track the state and history
 * of each distributed PIX transaction saga instance. This is crucial for monitoring
 * saga progress, debugging failures, and performing manual recovery if necessary.
 */
@Entity('pix_saga_log')
export class PixSagaLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // A unique identifier that links this saga log to the main PIX transaction.
  @Column({ type: 'uuid', unique: true })
  correlationId: string;

  // Stores the current status of the saga, useful for tracking progress.
  @Column({ type: 'enum', enum: PixSagaStatus, default: PixSagaStatus.STARTED })
  status: PixSagaStatus;

  // Stores the full context of the saga, including all data passed between steps.
  // This allows for replaying the saga or understanding its state at any point.
  @Column({ type: 'jsonb', nullable: true })
  sagaContext: object;

  // Records the last error encountered, if any, to aid in debugging and recovery.
  @Column({ type: 'text', nullable: true })
  lastError: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
