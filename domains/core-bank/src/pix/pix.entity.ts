import { Money } from '../money/money.value-object';

export const HOMOLOG_ISPB = '12345678' as const;

export enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  EVP = 'EVP',
}

export interface CreatePixCommand {
  debtorAccountId: string;
  creditorAccountId: string;
  receiverKey: string;
  receiverKeyType: PixKeyType;
  amount: Money;
  idempotencyKey: string;
  correlationId: string;
}

export interface PixPaymentRecord {
  id: string;
  paymentId: string;
  endToEndId: string;
  receiverKeyHmac: string;
  receiverMasked: string;
  receiverKeyType: PixKeyType;
  createdAt: string;
}