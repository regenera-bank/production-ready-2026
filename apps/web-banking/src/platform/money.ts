/**
 * Safe money parsing/formatting for web-banking.
 * Operations use integer cent strings — never float math for ledger paths.
 */

export class MoneyParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyParseError';
  }
}

const CENTS_PATTERN = /^-?\d{1,19}$/;

/** Parse human decimal input ("1234,56", "1.234,56") to cent string. */
export const parseMoneyInput = (input: string): string => {
  const trimmed = input.trim().replace(/\.(?=\d{3}(\D|$))/g, '');
  const match = /^(-?)(\d+)(?:[.,](\d{1,2}))?$/.exec(trimmed);
  if (!match) {
    throw new MoneyParseError(`Formato monetário inválido: "${input}"`);
  }
  const [, sign, intPart, fracPart = ''] = match;
  const cents = BigInt(intPart) * 100n + BigInt(fracPart.padEnd(2, '0'));
  const signed = sign === '-' ? -cents : cents;
  if (signed === 0n) {
    throw new MoneyParseError('Valor deve ser maior que zero');
  }
  return signed.toString();
};

/** Parse digit-only masked input (centavos) e.g. "12345" → "12345" cents. */
export const parseMaskedCentsInput = (rawDigits: string): string => {
  const normalized = rawDigits.replace(/\D/g, '');
  if (!normalized) {
    throw new MoneyParseError('Valor vazio');
  }
  const cents = BigInt(normalized);
  if (cents <= 0n) {
    throw new MoneyParseError('Valor deve ser maior que zero');
  }
  return cents.toString();
};

export const isValidCentsString = (value: string): boolean =>
  CENTS_PATTERN.test(value.trim());

/** Format cent string to BRL display without float math. */
export const formatCentsBrl = (cents: string | bigint): string => {
  const normalized = typeof cents === 'bigint' ? cents.toString() : cents.trim();
  if (!isValidCentsString(normalized)) {
    throw new MoneyParseError(`Centavos inválidos: "${String(cents)}"`);
  }
  const negative = normalized.startsWith('-');
  const abs = negative ? normalized.slice(1) : normalized;
  const intPart = abs.length <= 2 ? '0' : abs.slice(0, -2).replace(/^0+(?=\d)/, '') || '0';
  const fracPart = abs.padStart(3, '0').slice(-2);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${grouped},${fracPart}`;
};

export const formatCentsCurrency = (cents: string | bigint): string =>
  `R$ ${formatCentsBrl(cents)}`;

export const compareCents = (left: string, right: string): number => {
  const a = BigInt(left);
  const b = BigInt(right);
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

/** Stable idempotency key per user intent (BFF contract). */
export const createIdempotencyKey = (
  scope: 'pix' | 'transfer' | 'cards' | 'invest' | 'lifestyle',
): string =>
  `${scope}-ui-${crypto.randomUUID()}`;

/** Decimal string for APIs externas (ex.: Prometeo) sem float. */
export const centsToDecimalString = (cents: string | bigint): string => {
  const normalized =
    typeof cents === 'bigint' ? cents.toString() : cents.trim();
  if (!isValidCentsString(normalized)) {
    throw new MoneyParseError(`Centavos inválidos: "${String(cents)}"`);
  }
  const negative = normalized.startsWith('-');
  const abs = negative ? normalized.slice(1) : normalized;
  const padded = abs.padStart(3, '0');
  const intPart = padded.slice(0, -2).replace(/^0+(?=\d)/, '') || '0';
  const fracPart = padded.slice(-2);
  return `${negative ? '-' : ''}${intPart}.${fracPart}`;
};

/** Exibe input decimal do usuário via BigInt. */
export const formatAmountInputBrl = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) {
    return '0,00';
  }
  try {
    return formatCentsBrl(parseMoneyInput(trimmed));
  } catch {
    return trimmed;
  }
};