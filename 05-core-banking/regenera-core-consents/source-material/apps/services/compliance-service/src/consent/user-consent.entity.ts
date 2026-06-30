// [FILE] apps/services/compliance-service/src/consent/user-consent.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '@repo/core'; // Assumindo BaseEntity de @repo/core

@Entity('user_consents')
export class UserConsent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column('jsonb')
  purposes: {
    marketing: boolean;
    dataSharing: boolean;
    profiling: boolean;
  };

  @Column()
  consentedAt: Date;

  @Column({ nullable: true })
  revokedAt: Date;

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;
}
