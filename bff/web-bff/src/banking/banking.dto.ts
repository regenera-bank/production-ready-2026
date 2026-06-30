export interface TransactionItem {
  readonly id: string;
  readonly title: string;
  readonly party: string;
  readonly date: string;
  readonly amountCents: string;
  readonly type: 'inflow' | 'outflow';
  readonly channel: 'pix' | 'transfer' | 'seed';
  readonly icon: string;
  readonly category: 'lifestyle' | 'essential' | 'transport' | 'leisure' | 'investment';
}

export interface DashboardResponse {
  readonly accountId: string;
  readonly maskedAccount: string;
  readonly agency: string;
  readonly document: string;
  readonly balanceCents: string;
  readonly availableCents: string;
  readonly currency: 'BRL';
  readonly correlationId: string;
  readonly recentTransactions: readonly TransactionItem[];
}

export interface PixKeyItem {
  readonly id: string;
  readonly type: 'cpf' | 'email' | 'phone' | 'random';
  readonly key: string;
  readonly createdAt: string;
}

export interface PixLookupResponse {
  readonly found: boolean;
  readonly displayName?: string;
  readonly maskedKey?: string;
  readonly institution?: string;
}

export interface PixTransferResponse {
  readonly endToEndId: string;
  readonly paymentId: string;
  readonly receiverMasked: string;
  readonly amountCents: string;
  readonly balanceCents: string;
  readonly availableCents: string;
}

export interface OpenCustomerAccountResult {
  readonly accountId: string;
  readonly welcomeCreditCents: string;
}

export interface TransferResponse {
  readonly paymentId: string;
  readonly creditorName: string;
  readonly amountCents: string;
  readonly balanceCents: string;
  readonly availableCents: string;
}