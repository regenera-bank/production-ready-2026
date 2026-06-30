/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|
//
// PROJECT:       Regenera Bank
// CEO:           Raphaela Cerveski
// DEVELOPER:     Don Paulo Ricardo
// ID:            2098233287
// COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
//
// LICENSE:       EULA (End-User License Agreement)
// PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
//
// WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
//                engenharia reversa ou modificação não autorizada.
//
// |---------------------------------------------------------------------------------------|
// |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
// |---------------------------------------------------------------------------------------|

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
