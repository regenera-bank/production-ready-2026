import { Injectable } from '@nestjs/common';
import { HoldRecord } from './hold.entity';
import { HoldRepository } from './hold.repository';

@Injectable()
export class InMemoryHoldRepository implements HoldRepository {
  private readonly holds = new Map<string, HoldRecord>();

  async save(hold: HoldRecord): Promise<HoldRecord> {
    this.holds.set(hold.id, hold);
    return hold;
  }

  async findById(id: string): Promise<HoldRecord | null> {
    return this.holds.get(id) ?? null;
  }

  async findActiveByAccount(ledgerAccountId: string): Promise<HoldRecord[]> {
    return [...this.holds.values()].filter(
      (h) => h.ledgerAccountId === ledgerAccountId && h.status === 'ACTIVE',
    );
  }

  async findAllActive(): Promise<HoldRecord[]> {
    return [...this.holds.values()].filter((h) => h.status === 'ACTIVE');
  }

  clear(): void {
    this.holds.clear();
  }
}