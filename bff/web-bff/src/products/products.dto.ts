export interface CardDto {
  id: string;
  alias: string;
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
  limitCents: string;
  usedCents: string;
  brand: 'mastercard' | 'visa';
  type: string;
  status: 'active' | 'locked' | 'blocked';
  virtual: boolean;
}

export interface CardInvoiceDto {
  cardId: string;
  period: string;
  dueDate: string;
  totalCents: string;
  minimumCents: string;
  status: 'open' | 'paid';
}

export interface CardTransactionDto {
  id: string;
  cardId: string;
  title: string;
  amountCents: string;
  date: string;
  category: string;
  ledgerPaymentId?: string;
  balanceCents?: string;
}

export interface CardAuthorizationDto {
  authId: string;
  cardId: string;
  amountCents: string;
  merchant: string;
  status: 'authorized' | 'captured' | 'reversed';
}

export interface InvestmentCatalogItemDto {
  id: string;
  name: string;
  type: 'cdb' | 'lci' | 'fund';
  minAmountCents: string;
  expectedYieldPct: string;
  risk: 'conservative' | 'moderate' | 'aggressive';
}

export interface InvestmentPositionDto {
  productId: string;
  productName: string;
  amountCents: string;
  yieldPct: string;
}

export interface InvestmentOrderDto {
  id: string;
  productId: string;
  productName: string;
  amountCents: string;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  createdAt: string;
  updatedAt: string;
  ledgerPaymentId?: string;
  balanceCents?: string;
}

export interface SuitabilityDto {
  suitability: 'conservative' | 'moderate' | 'aggressive';
  score: number;
}

export interface ActivationStatusDto {
  externalProviderActive: boolean;
  message: string;
  sandbox: boolean;
}

/**
 * Rewards — pontuação calculada NO SERVIDOR a partir da projeção de extrato.
 * Regra única (programVersion) para todos os canais; o frontend nunca fabrica
 * pontos com fórmula local (§17/§30).
 */
export interface RewardsAccrualDto {
  label: string;
  points: number;
}

export interface RewardsDto {
  pointsBalance: number;
  tier: 'SEMENTE' | 'RAIZ' | 'COPA' | 'FLORESTA';
  nextTierAt: number | null;
  accruals: RewardsAccrualDto[];
  programVersion: string;
  asOf: string;
}