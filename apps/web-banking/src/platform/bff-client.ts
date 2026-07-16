import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';

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
  | 'didit_verification'
  | 'manual_review'
  | 'done';

export type DiditDocumentType = 'RG' | 'CNH';
export type DiditDocumentFormat = 'physical' | 'digital';
export type DiditDecision =
  | 'PROCESSING'
  | 'APPROVED'
  | 'MANUAL_REVIEW'
  | 'REJECTED'
  | 'ABANDONED'
  | 'EXPIRED'
  | 'PROVIDER_ERROR';
export type DiditWebhookTrust = 'body' | 'raw-body' | 'envelope-only';

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
  diditSessionId?: string;
  diditSessionUrl?: string;
  diditStatus?: string;
  diditDecision?: DiditDecision;
  diditDocumentType?: DiditDocumentType;
  diditDocumentFormat?: DiditDocumentFormat;
  diditLastSyncedAt?: string;
  diditWebhookTrust?: DiditWebhookTrust;
  diditKycWarnings?: string[];
  diditCoachingMessage?: string | null;
  diditRetryable?: boolean;
  diditFatal?: boolean;
  diditFlowInstructions?: string[];
  diditPresentation?: DiditPresentationDto;
  kycProvider?: string;
}

/** Presentation agregada do BFF (didit-decision.engine) — canal só renderiza. */
export interface DiditPresentationDto {
  uiState:
    | 'idle'
    | 'in_progress'
    | 'processing'
    | 'approved'
    | 'manual_review'
    | 'rejected'
    | 'expired'
    | 'error';
  headline: string;
  stepLabel: string;
  instructions: string[];
  message: string | null;
  retryable: boolean;
  fatal: boolean;
  code: string | null;
}

export interface DiditKycSessionResponse {
  provider?: 'DIDIT';
  sessionId: string;
  sessionToken?: string;
  url: string;
  status: string;
  statusResponse: OnboardingStatus;
}

export interface RegisterProfile {
  document: string;
  password: string;
  displayName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: AddressDto;
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

export type PaymentChannelStatus =
  | 'PROCESSING'
  | 'SETTLED'
  | 'UNKNOWN'
  | 'FAILED'
  | 'RECONCILED';

export interface PixTransferResponse {
  endToEndId: string;
  paymentId: string;
  receiverMasked: string;
  amountCents: string;
  /** Estado bancário explícito — o canal NÃO deve exibir sucesso em PROCESSING. */
  status: PaymentChannelStatus;
  /** Intervalo sugerido pelo BFF para o próximo poll do paymentId. */
  pollAfterMs: number;
  balanceCents: string;
  availableCents: string;
}

export interface PaymentStatusResponse {
  paymentId: string;
  status: PaymentChannelStatus;
  pollAfterMs: number;
  amountCents: string;
  correlationId: string;
  balanceCents?: string;
  availableCents?: string;
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

/** BFF em memória perde sessões homolog ao reiniciar — mensagem explícita para o canal. */
export const BFF_SESSION_EXPIRED_MESSAGE =
  'O BFF reiniciou — faça login novamente para continuar o KYC.';

export const formatBffUserError = (error: unknown): string => {
  if (error instanceof BffError) {
    if (error.status === 401) {
      return BFF_SESSION_EXPIRED_MESSAGE;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Falha na operação';
};

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

export interface ChannelBootstrap {
  status: 'ok';
  maintenance: boolean;
  minAppVersion: string;
  channelContractVersion: string;
  journeyRequired: boolean;
  supportedChannels: readonly string[];
}

export interface JourneySnapshot {
  journeyId: string;
  journeyType: string;
  currentState: string;
  version: number;
  allowedActions: readonly string[];
}

export const fetchChannelBootstrap = () =>
  request<ChannelBootstrap>('/channel/bootstrap', { method: 'GET' });

export const fetchActiveJourney = (token: string) =>
  request<{ found: boolean; journey?: JourneySnapshot }>('/onboarding/journeys/active', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

export const createJourney = (
  token: string,
  input: { channel?: string; deviceId?: string; locale?: string } = {},
) =>
  request<JourneySnapshot>('/onboarding/journeys', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-channel-id': input.channel ?? 'WEB',
      'x-device-id': input.deviceId ?? `dev_web_${Date.now()}`,
    },
    body: JSON.stringify({
      channel: input.channel ?? 'WEB',
      deviceId: input.deviceId ?? `dev_web_${Date.now()}`,
      locale: input.locale ?? 'pt-BR',
    }),
  });

/** Alinha canal com contrato de jornada sem alterar layout — só estado em memória. */
export const ensureChannelJourney = async (
  token: string,
): Promise<{ bootstrap: ChannelBootstrap; journey: JourneySnapshot | null }> => {
  const bootstrap = await fetchChannelBootstrap();
  if (!bootstrap.journeyRequired) {
    return { bootstrap, journey: null };
  }
  const active = await fetchActiveJourney(token);
  if (active.found && active.journey) {
    return { bootstrap, journey: active.journey };
  }
  const created = await createJourney(token);
  return { bootstrap, journey: created };
};

export interface BffIntegrationsHealth {
  status: 'ok';
  integrations: Record<string, boolean>;
  ready: boolean;
  kycProvider?: string;
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
  source: 'viacep' | 'brasilapi';
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

export const retryKycBiometric = (token: string) =>
  request<OnboardingStatus>(
    '/onboarding/kyc/retry-biometric',
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

export const createDiditKycSession = (
  token: string,
  options: {
    documentType: DiditDocumentType;
    documentFormat?: DiditDocumentFormat;
    forceNew?: boolean;
  },
) =>
  request<DiditKycSessionResponse>('/onboarding/kyc/didit/session', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(options),
  });

export const syncDiditKycStatus = (token: string) =>
  request<OnboardingStatus>('/onboarding/kyc/didit/sync', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

export const retryDiditKyc = (token: string) =>
  request<OnboardingStatus>('/onboarding/kyc/didit/retry', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

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

export interface PasswordResetRequestResult {
  acknowledged: boolean;
  message: string;
  devToken?: string;
}

export const requestPasswordReset = (document: string) =>
  request<PasswordResetRequestResult>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ document: normalizeDocumentParam(document) }),
  });

export const confirmPasswordReset = (token: string, newPassword: string) =>
  request<{ ok: boolean }>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });

export const createSession = (document: string, password: string) =>
  request<SessionResponse>('/auth/session', {
    method: 'POST',
    body: JSON.stringify({
      document: normalizeDocumentParam(document),
      password,
    }),
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

const normalizeDocumentParam = (document: string): string =>
  document.replace(/\D/g, '').slice(0, 11);

export const fetchPasskeyStatus = (document: string) =>
  request<{ enrolled: boolean }>(
    `/auth/passkey/status?document=${encodeURIComponent(normalizeDocumentParam(document))}`,
    { method: 'GET' },
  );

export const fetchPasskeyRegisterOptions = (document: string, password: string) =>
  request<PublicKeyCredentialCreationOptionsJSON>(
    '/auth/passkey/register/options',
    {
      method: 'POST',
      body: JSON.stringify({
        document: normalizeDocumentParam(document),
        password,
      }),
    },
  );

export const verifyPasskeyRegister = (
  document: string,
  response: RegistrationResponseJSON,
) =>
  request<SessionResponse>('/auth/passkey/register/verify', {
    method: 'POST',
    body: JSON.stringify({
      document: normalizeDocumentParam(document),
      response,
    }),
  });

export const fetchPasskeyLoginOptions = (document: string) =>
  request<PublicKeyCredentialRequestOptionsJSON>(
    '/auth/passkey/login/options',
    {
      method: 'POST',
      body: JSON.stringify({ document: normalizeDocumentParam(document) }),
    },
  );

export const verifyPasskeyLogin = (
  document: string,
  response: AuthenticationResponseJSON,
) =>
  request<SessionResponse>('/auth/passkey/login/verify', {
    method: 'POST',
    body: JSON.stringify({
      document: normalizeDocumentParam(document),
      response,
    }),
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

/** Consulta o estado do Pix por paymentId (retomável em qualquer canal). */
export const getPixTransferStatus = (token: string, paymentId: string) =>
  request<PaymentStatusResponse>(
    `/banking/pix/transfers/${encodeURIComponent(paymentId)}`,
    { method: 'GET' },
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

export interface RewardsAccrualDto {
  label: string;
  points: number;
}

/** Pontos calculados NO SERVIDOR — o canal apenas exibe (§17). */
export interface RewardsDto {
  pointsBalance: number;
  tier: 'SEMENTE' | 'RAIZ' | 'COPA' | 'FLORESTA';
  nextTierAt: number | null;
  accruals: RewardsAccrualDto[];
  programVersion: string;
  asOf: string;
}

export const fetchRewards = (token: string) =>
  request<RewardsDto>('/products/rewards', { method: 'GET' }, token);

export interface AssistantResponseDto {
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
  request<AssistantResponseDto>(
    '/assistant/chat',
    { method: 'POST', body: JSON.stringify({ message, context }) },
    token,
  );

export const speakWithRaphaelaViaBff = async (
  token: string,
  text: string,
  voice = 'Kore',
): Promise<string | null> => {
  const result = await request<{ audioBase64: string | null }>(
    '/assistant/speak',
    { method: 'POST', body: JSON.stringify({ text, voice }) },
    token,
  );
  return result.audioBase64;
};

export const sendTelegramViaBff = (token: string, message: string) =>
  request<{ ok: boolean; detail?: string }>(
    '/assistant/telegram',
    { method: 'POST', body: JSON.stringify({ message }) },
    token,
  );

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

export interface SuitabilityDto {
  suitability: 'conservative' | 'moderate' | 'aggressive';
  score: number;
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
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ limitCents }),
    },
    token,
  );

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
  status?: string;
}

export interface ActivationStatusDto {
  externalProviderActive: boolean;
  message: string;
  sandbox: boolean;
}

export const createVirtualCard = (
  token: string,
  limitCents: string,
  idempotencyKey: string,
) =>
  request<CardDto>(
    '/products/cards/virtual',
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ limitCents }),
    },
    token,
  );

export const fetchCardInvoice = (token: string, cardId: string) =>
  request<CardInvoiceDto>(
    `/products/cards/${encodeURIComponent(cardId)}/invoice`,
    { method: 'GET' },
    token,
  );

export const fetchCardTransactions = (token: string, cardId: string) =>
  request<CardTransactionDto[]>(
    `/products/cards/${encodeURIComponent(cardId)}/transactions`,
    { method: 'GET' },
    token,
  );

export const fetchCardsActivation = (token: string) =>
  request<ActivationStatusDto>('/products/cards/activation', { method: 'GET' }, token);

export const chargebackCardPurchase = (
  token: string,
  cardId: string,
  authId: string,
  idempotencyKey: string,
) =>
  request<{ status?: string; ledgerPaymentId?: string; balanceCents?: string }>(
    `/products/cards/${encodeURIComponent(cardId)}/chargeback/${encodeURIComponent(authId)}`,
    { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } },
    token,
  );

export const fetchInvestmentsActivation = (token: string) =>
  request<ActivationStatusDto>('/products/investments/activation', { method: 'GET' }, token);

export const fetchSuitability = (token: string) =>
  request<SuitabilityDto>('/products/investments/suitability', { method: 'GET' }, token);

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

export interface InvestmentOrderResultDto {
  id: string;
  status: string;
  ledgerPaymentId?: string;
  balanceCents?: string;
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

export const fetchInvestmentOrders = (token: string) =>
  request<InvestmentOrderDto[]>('/products/investments/orders', { method: 'GET' }, token);

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
  request<InvestmentOrderResultDto>(
    '/products/investments/orders',
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ productId, amountCents }),
    },
    token,
  );

export interface LifestyleModuleDto {
  id: string;
  label: string;
  viewId: string;
  status: string;
}

export interface LifestyleCatalogItemDto {
  id: string;
  name: string;
  priceCents: string;
  sandbox: boolean;
}

export interface LifestyleCatalogDto {
  moduleId: string;
  items: LifestyleCatalogItemDto[];
  sandbox: boolean;
}

export interface LifestyleActivationDto {
  externalProviderActive: boolean;
  sandbox: boolean;
  message: string;
}

export const fetchLifestyleModules = () =>
  request<LifestyleModuleDto[]>('/lifestyle/modules', { method: 'GET' });

export const fetchLifestyleCatalog = (token: string, moduleId: string) =>
  request<LifestyleCatalogDto>(
    `/lifestyle/${encodeURIComponent(moduleId)}/catalog`,
    { method: 'GET' },
    token,
  );

export const fetchLifestyleActivation = (token: string, moduleId: string) =>
  request<LifestyleActivationDto>(
    `/lifestyle/${encodeURIComponent(moduleId)}/activation`,
    { method: 'GET' },
    token,
  );

export interface LifestyleActionResultDto {
  referenceId: string;
  status: string;
  moduleId: string;
  action: string;
  idempotencyKey: string;
  metadata: Record<string, unknown>;
}

export const executeLifestyleAction = (
  token: string,
  moduleId: string,
  action: string,
  payload: Record<string, unknown> = {},
  idempotencyKey?: string,
) =>
  request<LifestyleActionResultDto>(
    `/lifestyle/${encodeURIComponent(moduleId)}/actions`,
    {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      body: JSON.stringify({ action, payload }),
    },
    token,
  );

export interface ConsentRecordDto {
  type: string;
  acceptedAt?: string;
  revokedAt?: string;
}

export const fetchConsentStatus = (token: string) =>
  request<{ items: ConsentRecordDto[] }>('/consents/status', { method: 'GET' }, token);

export const acceptConsent = (token: string, type: string) =>
  request<{ ok: boolean }>(
    '/consents/accept',
    { method: 'POST', body: JSON.stringify({ type }) },
    token,
  );

export interface CreditOfferDto {
  id: string;
  name: string;
  maxAmountCents: string;
  ratePct: string;
  sandbox: boolean;
}

export const fetchCreditOffers = (token: string) =>
  request<CreditOfferDto[]>('/products/credit/offers', { method: 'GET' }, token);

export interface TransactionReceiptDto {
  receiptId: string;
  transactionId: string;
  title: string;
  party: string;
  amountCents: string;
  type: 'inflow' | 'outflow';
  channel: string;
  issuedAt: string;
  maskedAccount?: string;
}

export const fetchTransactionReceipt = (token: string, transactionId: string) =>
  request<TransactionReceiptDto>(
    `/banking/transactions/${encodeURIComponent(transactionId)}/receipt`,
    { method: 'GET' },
    token,
  );

export interface PixExternalLookupDto {
  found: boolean;
  displayName?: string;
  institution?: string;
  sandbox: boolean;
}

export const lookupPixExternal = (token: string, key: string) =>
  request<PixExternalLookupDto>(
    `/banking/pix/external/lookup/${encodeURIComponent(key)}`,
    { method: 'GET' },
    token,
  );

export const refreshSession = (token: string) =>
  request<SessionResponse>('/auth/session/refresh', { method: 'POST' }, token);

export const revokeSession = (token: string) =>
  request<{ ok: boolean; revoked: boolean }>('/auth/session/revoke', { method: 'POST' }, token);

export const revokeConsent = (token: string, type: string) =>
  request<{ ok: boolean }>(
    '/consents/revoke',
    { method: 'POST', body: JSON.stringify({ type }) },
    token,
  );

export const centsToReais = (cents: string | number): number =>
  Number(cents) / 100;

export const reaisToCents = (value: number): string =>
  Math.round(value * 100).toString();

export const mapCardDto = (dto: CardDto) => ({
  id: dto.id,
  alias: dto.alias,
  number: dto.number,
  holder: dto.holder,
  expiry: dto.expiry,
  cvv: dto.cvv,
  limit: centsToReais(dto.limitCents),
  used: centsToReais(dto.usedCents),
  brand: dto.brand,
  type: (dto.type === 'black' || dto.type === 'infinite' || dto.type === 'platinum'
    ? dto.type
    : 'black') as 'black' | 'infinite' | 'platinum',
  status: (dto.status === 'locked' || dto.status === 'blocked' ? 'locked' : 'active') as
    | 'active'
    | 'locked',
});

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