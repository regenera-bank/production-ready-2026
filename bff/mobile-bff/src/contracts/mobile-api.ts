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
  userId: z.string().min(1),
  displayName: z.string().min(1),
  expiresAt: z.string().datetime(),
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

export const MobileApiPaths = {
  healthLive: '/health/live',
  healthReady: '/health/ready',
  home: '/v1/home',
  session: '/v1/auth/session',
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
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
export type TransactionDto = z.infer<typeof TransactionDtoSchema>;
export type PixKeyDto = z.infer<typeof PixKeyDtoSchema>;
export type PixTransferResponse = z.infer<typeof PixTransferResponseSchema>;
export type TransferResponse = z.infer<typeof TransferResponseSchema>;