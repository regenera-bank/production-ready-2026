import { HoldRecord } from './hold.entity';

export interface HoldRepository {
  save(hold: HoldRecord): Promise<HoldRecord>;
  findById(id: string): Promise<HoldRecord | null>;
  findActiveByAccount(ledgerAccountId: string): Promise<HoldRecord[]>;
  findAllActive(): Promise<HoldRecord[]>;
}