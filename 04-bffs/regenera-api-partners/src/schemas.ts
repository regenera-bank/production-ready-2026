import { z } from 'zod';

export const UUID = z.string().uuid();
export const AccountId = z.string().min(8).max(80);
export const PaymentId = z.string().uuid();
export const CreatePixPayment = z.object({
  sourceAccountId: AccountId,
  destination: z.object({
    keyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP']),
    key: z.string().min(1).max(140)
  }),
  amount: z.object({
    currency: z.literal('BRL'),
    value: z.string().regex(/^\d{1,17}\.\d{2}$/)
  }),
  description: z.string().max(140).optional()
}).strict();
