
import { z } from 'zod';

// Validação estrita: O CPF deve conter exatamente 11 dígitos numéricos.
export const CpfValidationSchema = z.object({
  document_number: z.string().regex(/^\d{11}$/, 'O CPF deve conter exatamente 11 números, sem traços ou pontos.'),
});

// A estrutura esperada da API da Prometeo após uma consulta bem-sucedida
export interface CpfBasicData {
  TaxIdNumber: number;
  TaxIdCountry: string;
  Name: string;
  Gender: string;
}

export type CpfPayload = z.infer<typeof CpfValidationSchema>;
