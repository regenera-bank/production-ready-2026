import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('reconciliation_runs')
export class ReconciliationRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  jobName: string;

  @Column()
  status: string; // 'SUCCESS', 'FAILED', 'DIVERGENCE_FOUND'

  @Column({ type: 'int', default: 0 })
  divergencesCount: number;

  @Column({ type: 'simple-json', nullable: true })
  divergencesDetails: any;

  @Column({ type: 'int' })
  durationMs: number;

  @CreateDateColumn()
  executedAt: Date;
}
