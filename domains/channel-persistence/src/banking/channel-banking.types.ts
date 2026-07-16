export interface PixDirectoryRecord {
  userId: string;
  displayName: string;
  accountId: string;
  keyType: string;
  rawKey: string;
}

export interface PixKeyRecord {
  id: string;
  type: string;
  key: string;
  createdAt: string;
}

export interface BankingSnapshot {
  accountsByUser: Record<string, string>;
  balanceCentsByUser: Record<string, string>;
  pixKeysByUser: Record<string, PixKeyRecord[]>;
  pixDirectory: Record<string, PixDirectoryRecord>;
  welcomeCreditGrantedUserIds: Record<string, true>;
  welcomeCreditAccountsOpened: number;
}

export const emptyBankingSnapshot = (): BankingSnapshot => ({
  accountsByUser: {},
  balanceCentsByUser: {},
  pixKeysByUser: {},
  pixDirectory: {},
  welcomeCreditGrantedUserIds: {},
  welcomeCreditAccountsOpened: 0,
});