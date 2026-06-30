
import { z } from 'zod';

export const PrometeoLoginRequestSchema = z.object({
  provider: z.string(),
  username: z.string(),
  password: z.string(),
  type: z.string().optional()
});

export const PrometeoLoginResponseSchema = z.object({
  status: z.enum(['logged_in', 'interaction_required', 'wrong_credentials', 'max_sessions_reached']),
  key: z.string().optional(),
  message: z.string().optional()
});

export const PrometeoAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.string(),
  branch: z.string(),
  currency: z.string(),
  balance: z.number()
});

export const PrometeoAccountsResponseSchema = z.object({
  status: z.string(),
  accounts: z.array(PrometeoAccountSchema).optional()
});

export type PrometeoLoginRequest = z.infer<typeof PrometeoLoginRequestSchema>;
export type PrometeoLoginResponse = z.infer<typeof PrometeoLoginResponseSchema>;
export type PrometeoAccount = z.infer<typeof PrometeoAccountSchema>;
export type PrometeoAccountsResponse = z.infer<typeof PrometeoAccountsResponseSchema>;
