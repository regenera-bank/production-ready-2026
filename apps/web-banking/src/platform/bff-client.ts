import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { parseMoneyInput } from './money';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export interface AddressDto {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface SessionResponse {
  accessToken: string;
  userId: string;
  displayName: string;
  expiresAt: string;
  kycStatus?: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  accountStatus?: 'NONE' | 'ACTIVE';
}

export type KycPipelineStep =
  | 'cadastral'
  | 'document'
  | 'selfie'
  | 'manual_review'
  | 'done';

export interface OnboardingProfileUpdate {
  document: string;
  displayName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: AddressDto;
}

export interface OnboardingStatus {
  userId: string;
  displayName: string;
  document: string;
  email: string;
  phone: string;
  birthDate?: string;
  profileComplete?: boolean;
  address: AddressDto;
  kycStatus: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  accountStatus: 'NONE' | 'ACTIVE';
  kycStep: KycPipelineStep;
  kycReason?: string;
  identitySource?: string;
  pepScore?: number;
  accountOpenedAt?: string;
}

export interface RegisterProfile {
  document: string;
  password: string;
  displayName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: AddressDto;
}

export interface TransactionDto {
  id: string;
  title: string;
  party: string;
  date: string;
  amountCents: string;
  type: 'inflow' | 'outflow';
  channel: 'pix' | 'transfer' | 'seed';
  icon: string;
  category: 'lifestyle' | 'essential' | 'transport' | 'leisure' | 'investment';
}

export interface DashboardResponse {
  accountId: string;
  maskedAccount: string;
  agency: string;
  document: string;
  balanceCents: string;
  availableCents: string;
  currency: 'BRL';
  correlationId: string;
  recentTransactions: readonly TransactionDto[];
}

export interface PixKeyDto {
  id: string;
  type: 'cpf' | 'email' | 'phone' | 'random';
  key: string;
  createdAt: string;
}

export interface PixLookupResponse {
  found: boolean;
  displayName?: string;
  maskedKey?: string;
  institution?: string;
}

export interface PixTransferResponse {
  endToEndId: string;
  paymentId: string;
  receiverMasked: string;
  amountCents: string;
  balanceCents: string;
  availableCents: string;
}

export interface TransferResponse {
  paymentId: string;
  creditorName: string;
  amountCents: string;
  balanceCents: string;
  availableCents: string;
}

export class BffError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const request = async <T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> => {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!response.ok) {
    let body = await response.text();
    try {
      const parsed = JSON.parse(body) as { message?: string | string[] };
      if (parsed.message) {
        body = Array.isArray(parsed.message)
          ? parsed.message.join(', ')
          : parsed.message;
      }
    } catch {
      /* mantém texto bruto */
    }
    throw new BffError(body || response.statusText, response.status);
  }
  return (await response.json()) as T;
};

export const checkBffHealth = async (): Promise<boolean> => {
  try {
    const health = await request<{ status: string }>('/health', { method: 'GET' });
    return health.status === 'ok';
  } catch {
    return false;
  }
};

export interface BffIntegrationsHealth {
  status: 'ok';
  integrations: Record<string, boolean>;
  ready: boolean;
  prometeoIdentityUrl?: string;
  kycHomolog?: boolean;
}

export const fetchBffIntegrations = async (): Promise<BffIntegrationsHealth | null> => {
  try {
    return await request<BffIntegrationsHealth>('/health/integrations', {
      method: 'GET',
    });
  } catch {
    return null;
  }
};

export const registerAccount = (profile: RegisterProfile) =>
  request<SessionResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(profile),
  });

export interface CepLookupResult {
  postalCode: string;
  street: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  ibge?: string;
  source: 'viacep';
}

export const lookupCep = (cep: string) =>
  request<CepLookupResult>(`/address/cep/${encodeURIComponent(cep)}`, {
    method: 'GET',
  });

export const fetchOnboardingStatus = (token: string) =>
  request<OnboardingStatus>('/onboarding/status', { method: 'GET' }, token);

export const updateOnboardingProfile = (
  token: string,
  profile: OnboardingProfileUpdate,
) =>
  request<OnboardingStatus>(
    '/onboarding/profile',
    { method: 'POST', body: JSON.stringify(profile) },
    token,
  );

export const submitKyc = (token: string) =>
  request<OnboardingStatus>(
    '/onboarding/kyc/submit',
    { method: 'POST', body: '{}' },
    token,
  );

export const retryKycCadastral = (token: string) =>
  request<OnboardingStatus>(
    '/onboarding/kyc/retry',
    { method: 'POST', body: '{}' },
    token,
  );

export interface MonitoredPaymentItem {
  requestId: string;
  eventType: string;
  amount?: string;
  currency?: string;
  concept?: string;
  status: string;
  transferDetail?: {
    status?: string;
    amount?: string;
    currency?: string;
    concept?: string;
    destination_name?: string;
  };
}

export const fetchMonitoredPayments = (token: string) =>
  request<{ items: MonitoredPaymentItem[]; mode: string }>(
    '/prometeo/payments/monitored',
    { method: 'GET' },
    token,
  );

export const fetchMonitoredPayment = (token: string, requestId: string) =>
  request<{ found: boolean; item?: MonitoredPaymentItem }>(
    `/prometeo/payments/monitored/${encodeURIComponent(requestId)}`,
    { method: 'GET' },
    token,
  );

export interface PrometeoWidgetConfig {
  widgetConfigured: boolean;
  paymentsBaseUrl: string;
  widgetSdkVersion: string;
}

export const fetchPrometeoWidgetConfig = () =>
  request<PrometeoWidgetConfig>('/prometeo/payments/config', {
    method: 'GET',
  });

export interface PrometeoPaymentIntentResponse {
  intentId: string;
  widgetId: string;
  amount: string;
  currency: string;
  concept?: string;
}

export const createPrometeoPaymentIntent = (
  token: string,
  body: {
    amount: string;
    currency?: string;
    concept?: string;
    reference?: string;
  },
) =>
  request<PrometeoPaymentIntentResponse>(
    '/prometeo/payments/intent',
    { method: 'POST', body: JSON.stringify(body) },
    token,
  );

export const submitKycDocument = (
  token: string,
  fileBase64: string,
  type: 'RG' | 'CNH' = 'RG',
) =>
  request<OnboardingStatus>(
    '/onboarding/kyc/document',
    { method: 'POST', body: JSON.stringify({ fileBase64, type }) },
    token,
  );

export const submitKycSelfie = (token: string, selfieBase64: string) =>
  request<OnboardingStatus>(
    '/onboarding/kyc/selfie',
    { method: 'POST', body: JSON.stringify({ selfieBase64 }) },
    token,
  );

export const openBankAccount = (token: string) =>
  request<{ accountId: string; accountStatus: 'ACTIVE'; message: string }>(
    '/onboarding/account/open',
    { method: 'POST', body: '{}' },
    token,
  );

export const createSession = (document: string, password: string) =>
  request<SessionResponse>('/auth/session', {
    method: 'POST',
    body: JSON.stringify({ document, password }),
  });

export interface PasswordResetRequestResponse {
  acknowledged: true;
  message: string;
  devToken?: string;
}

export const requestPasswordReset = (document: string) =>
  request<PasswordResetRequestResponse>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ document }),
  });

export const confirmPasswordReset = (token: string, newPassword: string) =>
  request<{ ok: true }>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });

export const createFirebaseSession = (idToken: string) =>
  request<SessionResponse>('/auth/firebase/session', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });

export const registerFirebaseAccount = (idToken: string, profile: RegisterProfile) =>
  request<SessionResponse>('/auth/firebase/register', {
    method: 'POST',
    body: JSON.stringify({ idToken, ...profile }),
  });

export const completeFirebaseProfile = (idToken: string, profile: RegisterProfile) =>
  request<SessionResponse>('/auth/firebase/profile', {
    method: 'POST',
    body: JSON.stringify({ idToken, ...profile }),
  });

export const fetchPasskeyStatus = (document: string) =>
  request<{ enrolled: boolean }>(
    `/auth/passkey/status?document=${encodeURIComponent(document.trim())}`,
    { method: 'GET' },
  );

export const fetchPasskeyRegisterOptions = (document: string, password: string) =>
  request<PublicKeyCredentialCreationOptionsJSON>(
    '/auth/passkey/register/options',
    { method: 'POST', body: JSON.stringify({ document, password }) },
  );

export const verifyPasskeyRegister = (
  document: string,
  response: RegistrationResponseJSON,
) =>
  request<SessionResponse>('/auth/passkey/register/verify', {
    method: 'POST',
    body: JSON.stringify({ document, response }),
  });

export const fetchPasskeyLoginOptions = (document: string) =>
  request<PublicKeyCredentialRequestOptionsJSON>(
    '/auth/passkey/login/options',
    { method: 'POST', body: JSON.stringify({ document }) },
  );

export const verifyPasskeyLogin = (
  document: string,
  response: AuthenticationResponseJSON,
) =>
  request<SessionResponse>('/auth/passkey/login/verify', {
    method: 'POST',
    body: JSON.stringify({ document, response }),
  });

export const fetchPasskeyStatusMe = (token: string) =>
  request<{ enrolled: boolean }>('/auth/passkey/status/me', { method: 'GET' }, token);

export const fetchPasskeyRegisterOptionsMe = (token: string) =>
  request<PublicKeyCredentialCreationOptionsJSON>(
    '/auth/passkey/register/options/me',
    { method: 'POST' },
    token,
  );

export const verifyPasskeyRegisterMe = (
  token: string,
  response: RegistrationResponseJSON,
) =>
  request<{ enrolled: true }>('/auth/passkey/register/verify/me', {
    method: 'POST',
    body: JSON.stringify({ response }),
  }, token);

export const fetchDashboard = (token: string) =>
  request<DashboardResponse>('/banking/dashboard', { method: 'GET' }, token);

export const fetchTransactions = (token: string) =>
  request<{ items: TransactionDto[] }>(
    '/banking/transactions',
    { method: 'GET' },
    token,
  );

export const fetchPixKeys = (token: string) =>
  request<{ items: PixKeyDto[] }>('/banking/pix/keys', { method: 'GET' }, token);

export const registerPixKey = (
  token: string,
  key: string,
  type: PixKeyDto['type'],
) =>
  request<PixKeyDto>(
    '/banking/pix/keys',
    { method: 'POST', body: JSON.stringify({ key, type }) },
    token,
  );

export const lookupPixKey = (token: string, key: string) =>
  request<PixLookupResponse>(
    '/banking/pix/lookup',
    { method: 'POST', body: JSON.stringify({ key }) },
    token,
  );

export const sendPixTransfer = (
  token: string,
  key: string,
  amountCents: string,
  idempotencyKey: string,
) =>
  request<PixTransferResponse>(
    '/banking/pix/transfers',
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ key, amountCents }),
    },
    token,
  );

export const sendTransfer = (
  token: string,
  toDocument: string,
  amountCents: string,
  idempotencyKey: string,
) =>
  request<TransferResponse>(
    '/banking/transfers',
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ toDocument, amountCents }),
    },
    token,
  );

export interface AiResponseDto {
  text: string;
  action: string;
  params?: Record<string, unknown>;
  searchResults?: { title: string; url: string }[];
  mapResults?: unknown[];
}

export const chatWithRaphaelaViaBff = (
  token: string,
  message: string,
  context: string,
) =>
  request<AiResponseDto>(
    '/ai/chat',
    { method: 'POST', body: JSON.stringify({ message, context }) },
    token,
  );

export const speakWithRaphaelaViaBff = async (
  token: string,
  text: string,
  voice = 'Kore',
): Promise<string | null> => {
  const result = await request<{ audioBase64: string | null }>(
    '/ai/speak',
    { method: 'POST', body: JSON.stringify({ text, voice }) },
    token,
  );
  return result.audioBase64;
};

export const sendTelegramViaBff = (token: string, message: string) =>
  request<{ ok: boolean; detail?: string }>(
    '/ai/telegram',
    { method: 'POST', body: JSON.stringify({ message }) },
    token,
  );

/** Display-only — never use for ledger operations. */
export const centsToReais = (cents: string | number): number =>
  Number(cents) / 100;

/**
 * Converts decimal input or cent string to BFF amountCents.
 * Accepts only strings to avoid float hazards in financial paths.
 */
export const reaisToCents = (value: string): string => {
  const trimmed = value.trim();
  if (/^\d{1,19}$/.test(trimmed)) {
    return trimmed;
  }
  return parseMoneyInput(trimmed);
};

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
}

export const fetchCards = (token: string) =>
  request<CardDto[]>('/products/cards', { method: 'GET' }, token);

export const blockCard = (token: string, cardId: string, idempotencyKey: string) =>
  request<CardDto>(
    `/products/cards/${encodeURIComponent(cardId)}/block`,
    { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } },
    token,
  );

export const unblockCard = (token: string, cardId: string, idempotencyKey: string) =>
  request<CardDto>(
    `/products/cards/${encodeURIComponent(cardId)}/unblock`,
    { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } },
    token,
  );

export const updateCardLimit = (
  token: string,
  cardId: string,
  limitCents: string,
  idempotencyKey: string,
) =>
  request<CardDto>(
    `/products/cards/${encodeURIComponent(cardId)}/limit`,
    { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify({ limitCents }) },
    token,
  );

export const fetchInvestmentCatalog = (token: string) =>
  request<InvestmentCatalogItemDto[]>('/products/investments/catalog', { method: 'GET' }, token);

export const fetchInvestmentPositions = (token: string) =>
  request<InvestmentPositionDto[]>('/products/investments/positions', { method: 'GET' }, token);

export const placeInvestmentOrder = (
  token: string,
  productId: string,
  amountCents: string,
  idempotencyKey: string,
) =>
  request<InvestmentOrderDto>(
    '/products/investments/orders',
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ productId, amountCents }),
    },
    token,
  );

export const fetchInvestmentOrders = (token: string) =>
  request<InvestmentOrderDto[]>('/products/investments/orders', { method: 'GET' }, token);

export const mapTransactionDto = (dto: TransactionDto) => ({
  id: dto.id,
  title: dto.title,
  party: dto.party,
  date: formatTxDate(dto.date),
  amount: centsToReais(dto.amountCents),
  type: dto.type,
  icon: dto.icon,
  category: dto.category,
  channel: dto.channel,
});

const formatTxDate = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (isToday) return `Hoje ${time}`;
  if (isYesterday) return `Ontem ${time}`;
  return date.toLocaleDateString('pt-BR');
};