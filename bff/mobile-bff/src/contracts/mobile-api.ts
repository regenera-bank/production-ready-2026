/**
 * Contrato compartilhado iOS/Android ↔ mobile-bff.
 * Valores monetários sempre em centavos (string) — nunca float.
 */
import { z } from 'zod';

export const MoneyCentsSchema = z
  .string()
  .regex(/^\d{1,19}$/, 'amountCents deve ser inteiro em centavos');

export const SessionResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
  userId: z.string().min(1),
  displayName: z.string().min(1),
  expiresAt: z.string().datetime(),
  refreshExpiresAt: z.string().datetime().optional(),
  kycStatus: z.enum(['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED']).optional(),
  accountStatus: z.enum(['NONE', 'ACTIVE']).optional(),
});

export const TransactionDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  party: z.string(),
  date: z.string(),
  amountCents: MoneyCentsSchema,
  type: z.enum(['inflow', 'outflow']),
  channel: z.enum(['pix', 'transfer', 'seed']),
  icon: z.string(),
  category: z.enum(['lifestyle', 'essential', 'transport', 'leisure', 'investment']),
});

export const DashboardResponseSchema = z.object({
  accountId: z.string(),
  maskedAccount: z.string(),
  agency: z.string(),
  document: z.string(),
  balanceCents: MoneyCentsSchema,
  availableCents: MoneyCentsSchema,
  currency: z.literal('BRL'),
  correlationId: z.string(),
  recentTransactions: z.array(TransactionDtoSchema),
});

export const PixKeyDtoSchema = z.object({
  id: z.string(),
  type: z.enum(['cpf', 'email', 'phone', 'random']),
  key: z.string(),
  createdAt: z.string(),
});

export const PixTransferResponseSchema = z.object({
  endToEndId: z.string(),
  paymentId: z.string(),
  receiverMasked: z.string(),
  amountCents: MoneyCentsSchema,
  balanceCents: MoneyCentsSchema,
  availableCents: MoneyCentsSchema,
});

export const TransferResponseSchema = z.object({
  paymentId: z.string(),
  creditorName: z.string(),
  amountCents: MoneyCentsSchema,
  balanceCents: MoneyCentsSchema,
  availableCents: MoneyCentsSchema,
});

export const HealthLiveResponseSchema = z.object({
  status: z.literal('UP'),
  service: z.literal('mobile-bff'),
});

export const HomeModuleSchema = z.object({
  moduleId: z.string(),
  slug: z.string(),
  classification: z.enum([
    'PRODUCTION',
    'SANDBOX',
    'DISABLED',
    'ADMIN_ONLY',
    'EXTERNAL_ACTIVATION',
  ]),
  enabled: z.boolean(),
});

export const HomeResponseSchema = z.object({
  service: z.literal('mobile-bff'),
  ready: z.boolean(),
  correlationId: z.string(),
  channelContractVersion: z.string(),
  supportedChannels: z.array(z.string()),
  modules: z.array(HomeModuleSchema),
  dashboard: DashboardResponseSchema.optional(),
});

export const MobileApiPaths = {
  /** GET com baseUrl `http://host:3201/v1/` → `/v1/health` */
  health: '/v1/health',
  healthLive: '/health/live',
  healthReady: '/health/ready',
  home: '/v1/home',
  session: '/v1/auth/session',
  sessionRefresh: '/v1/auth/session/refresh',
  register: '/v1/auth/register',
  sessionRevoke: '/v1/auth/session/revoke',
  sessionRevokeAll: '/v1/auth/session/revoke-all',
  onboardingStatus: '/v1/onboarding/status',
  assistantChat: '/v1/assistant/chat',
  dashboard: '/v1/banking/dashboard',
  transactions: '/v1/banking/transactions',
  pixKeys: '/v1/banking/pix/keys',
  pixLookup: '/v1/banking/pix/lookup',
  pixTransfers: '/v1/banking/pix/transfers',
  transfers: '/v1/banking/transfers',
  cards: '/v1/banking/cards',
  credit: '/v1/banking/credit',
  investments: '/v1/banking/investments',
  profile: '/v1/profile',
  support: '/v1/support/tickets',
} as const;

export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type HomeResponse = z.infer<typeof HomeResponseSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
export type TransactionDto = z.infer<typeof TransactionDtoSchema>;
export type PixKeyDto = z.infer<typeof PixKeyDtoSchema>;
export type PixTransferResponse = z.infer<typeof PixTransferResponseSchema>;
export type TransferResponse = z.infer<typeof TransferResponseSchema>;