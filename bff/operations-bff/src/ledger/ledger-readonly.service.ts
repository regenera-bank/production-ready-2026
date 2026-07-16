import { Injectable } from '@nestjs/common';

export interface LedgerAccountDto {
  readonly accountId: string;
  readonly currency: string;
  readonly balanceMinor: number;
  readonly readOnly: true;
}

export interface LedgerEntryDto {
  readonly entryId: string;
  readonly accountId: string;
  readonly amountMinor: number;
  readonly direction: 'CREDIT' | 'DEBIT';
  readonly postedAt: string;
}

@Injectable()
export class LedgerReadonlyService {
  private readonly accounts: LedgerAccountDto[] = [
    { accountId: 'ACC-001', currency: 'BRL', balanceMinor: 1_250_000, readOnly: true },
    { accountId: 'ACC-002', currency: 'BRL', balanceMinor: 450_000, readOnly: true },
  ];

  private readonly entries: LedgerEntryDto[] = [
    {
      entryId: 'ENT-1001',
      accountId: 'ACC-001',
      amountMinor: 50_000,
      direction: 'CREDIT',
      postedAt: '2026-06-30T10:00:00Z',
    },
    {
      entryId: 'ENT-1002',
      accountId: 'ACC-001',
      amountMinor: 10_000,
      direction: 'DEBIT',
      postedAt: '2026-06-30T11:00:00Z',
    },
    {
      entryId: 'ENT-2001',
      accountId: 'ACC-002',
      amountMinor: 25_000,
      direction: 'CREDIT',
      postedAt: '2026-06-30T09:30:00Z',
    },
  ];

  listAccounts(): LedgerAccountDto[] {
    return this.accounts.map((account) => ({ ...account, readOnly: true }));
  }

  listEntries(accountId: string): LedgerEntryDto[] {
    return this.entries
      .filter((entry) => entry.accountId === accountId)
      .map((entry) => ({ ...entry }));
  }
}