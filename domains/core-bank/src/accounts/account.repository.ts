import { LedgerAccount } from './account.entity';

export interface AccountRepository {
  save(account: LedgerAccount): Promise<LedgerAccount>;
  findById(id: string): Promise<LedgerAccount | null>;
  findByExternalReference(reference: string): Promise<LedgerAccount | null>;
}