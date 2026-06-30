/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Service - Saga State Enum (Conceptual)
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/saga-state.enum.ts
export enum PixSagaStatus {
  STARTED = 'STARTED',
  SPI_INITIATED = 'SPI_INITIATED',
  SOURCE_DEBITED = 'SOURCE_DEBITED',
  DESTINATION_CREDITED = 'DESTINATION_CREDITED',
  TRANSACTION_PERSISTED = 'TRANSACTION_PERSISTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED',
}

// In a full implementation, a SagaLog entity would track the state and history
// of each saga instance, including which steps have completed and which
// compensating transactions have been applied. This entity would be persisted
// in a database (e.g., PostgreSQL for transactional integrity).
//
// Example SagaLog Entity (conceptual):
// @Entity('saga_log')
// export class SagaLog {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;
//
//   @Column({ type: 'uuid' })
//   correlationId: string; // Links to the PIX transaction ID
//
//   @Column({ type: 'jsonb' })
//   sagaData: object; // Full context of the saga
//
//   @Column({ type: 'enum', enum: PixSagaStatus, default: PixSagaStatus.STARTED })
//   status: PixSagaStatus;
//
//   @Column({ type: 'text', nullable: true })
//   lastError: string;
//
//   @CreateDateColumn()
//   createdAt: Date;
//
//   @UpdateDateColumn()
//   updatedAt: Date;
// }
