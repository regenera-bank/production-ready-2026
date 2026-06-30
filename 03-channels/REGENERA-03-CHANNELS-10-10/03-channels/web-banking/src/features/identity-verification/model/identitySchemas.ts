
import { z } from 'zod';

export const CpfValidationRequestSchema = z.object({
  document_number: z.string().regex(/^\d{11}$/, 'O CPF deve conter exatamente 11 dígitos numéricos')
});

export const CpfValidationResponseSchema = z.object({
  data: z.object({
    Result: z.object({
      BasicData: z.object({
        TaxIdNumber: z.number(),
        TaxIdCountry: z.string(),
        Name: z.string(),
        Gender: z.string()
      })
    })
  }).nullable(),
  errors: z.any().nullable()
});

export type CpfValidationRequest = z.infer<typeof CpfValidationRequestSchema>;
export type CpfValidationResponse = z.infer<typeof CpfValidationResponseSchema>;
