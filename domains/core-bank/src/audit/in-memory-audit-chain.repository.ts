import { Injectable } from '@nestjs/common';
import { AuditEventRecord } from './audit-chain.entity';
import { AuditChainRepository } from './audit-chain.repository';

@Injectable()
export class InMemoryAuditChainRepository implements AuditChainRepository {
  private events: AuditEventRecord[] = [];
  private seq = 0;

  async findLast(): Promise<AuditEventRecord | null> {
    if (this.events.length === 0) return null;
    return this.events[this.events.length - 1]!;
  }

  async findAllOrdered(): Promise<AuditEventRecord[]> {
    return [...this.events];
  }

  async append(event: Omit<AuditEventRecord, 'id'>): Promise<AuditEventRecord> {
    this.seq += 1;
    const record: AuditEventRecord = { ...event, id: this.seq };
    this.events.push(record);
    return record;
  }

  async replaceForTest(id: number, event: AuditEventRecord): Promise<void> {
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx >= 0) {
      this.events[idx] = event;
    }
  }

  clear(): void {
    this.events = [];
    this.seq = 0;
  }
}