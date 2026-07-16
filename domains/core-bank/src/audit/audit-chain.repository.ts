import { AuditEventRecord } from './audit-chain.entity';

export interface AuditChainRepository {
  findLast(): Promise<AuditEventRecord | null>;
  findAllOrdered(): Promise<AuditEventRecord[]>;
  append(event: Omit<AuditEventRecord, 'id'>): Promise<AuditEventRecord>;
  /** Somente para testes de detecção de adulteração — produção é append-only no PG. */
  replaceForTest(id: number, event: AuditEventRecord): Promise<void>;
}