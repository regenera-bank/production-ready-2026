
import { z } from 'zod';

export const CreatePaymentLinkRequestSchema = z.object({
  amount: z.number().positive('O valor deve ser maior que zero'),
  currency: z.string().length(3).default('BRL'),
  description: z.string().max(255).optional(),
  payer_name: z.string().optional(),
  payer_email: z.string().email().optional(),
  expires_in_days: z.number().int().min(1).default(7)
});

export const PaymentLinkResponseSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  status: z.enum(['ACTIVE', 'PAID', 'EXPIRED', 'CANCELLED']),
  amount: z.number(),
  currency: z.string(),
  created_at: z.string()
});

export type CreatePaymentLinkRequest = z.infer<typeof CreatePaymentLinkRequestSchema>;
export type PaymentLinkResponse = z.infer<typeof PaymentLinkResponseSchema>;
