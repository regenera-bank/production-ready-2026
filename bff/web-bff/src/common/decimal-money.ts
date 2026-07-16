import { BadRequestException } from '@nestjs/common';

const parseDecimalToCents = (raw: string): bigint => {
  const normalized = raw.replace(',', '.').trim();
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) {
    throw new BadRequestException('amount inválido');
  }
  const [, sign, intPart, fracPart = ''] = match;
  const cents = BigInt(intPart) * 100n + BigInt(fracPart.padEnd(2, '0'));
  const signed = sign === '-' ? -cents : cents;
  if (signed <= 0n) {
    throw new BadRequestException('amount inválido');
  }
  return signed;
};

const centsToDecimalString = (cents: bigint): string => {
  const intPart = cents / 100n;
  const fracPart = (cents % 100n).toString().padStart(2, '0');
  return `${intPart}.${fracPart}`;
};

/** Normaliza entrada decimal para string ISO sem float (contrato Prometeo). */
export const normalizeDecimalAmount = (raw: string): string =>
  centsToDecimalString(parseDecimalToCents(raw));