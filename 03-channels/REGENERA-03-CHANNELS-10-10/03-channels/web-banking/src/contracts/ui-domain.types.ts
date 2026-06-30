
export type TierLevel = 'Plus' | 'Premium' | 'Metal' | 'Enterprise' | 'Ultra';

export interface IUser {
  neuralId: string;
  name: string;
  email: string;
  tier: TierLevel;
  agency: string;
  account: string;
  status: 'active' | 'locked' | 'pending_kyc';
}

export interface ITransaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'PIX_IN' | 'PIX_OUT' | 'TRANSFER' | 'PAYMENT' | 'TRADE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  counterpartyName: string;
  counterpartyKey?: string;
  endToEndId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface IPortfolioAsset {
  symbol: string;
  assetType: 'STOCK' | 'CRYPTO' | 'ETF' | 'FIXED_INCOME';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  profitabilityPct: number;
}

export interface ICard {
  id: string;
  alias: string;
  lastFour: string;
  brand: 'Mastercard' | 'Visa' | 'Amex';
  type: 'black' | 'infinite' | 'platinum';
  limit: number;
  used: number;
  expiry: string;
}

export interface INeuralInsight {
  type: 'alerta' | 'sucesso' | 'info';
  message: string;
  confidenceScore: number;
  timestamp: string;
}

export interface IOpenFinanceBank {
  id: string;
  name: string;
  balance: number;
  connected: boolean;
  logoCode: string;
  lastSync: string;
}
