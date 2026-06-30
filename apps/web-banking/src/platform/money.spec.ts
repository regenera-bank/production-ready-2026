import { describe, expect, it } from 'vitest';
import {
  compareCents,
  createIdempotencyKey,
  formatCentsBrl,
  formatCentsCurrency,
  parseMaskedCentsInput,
  parseMoneyInput,
} from './money';

describe('money contract', () => {
  it('parseMoneyInput rejects float hazards', () => {
    expect(parseMoneyInput('10,50')).toBe('1050');
    expect(parseMoneyInput('1.234,56')).toBe('123456');
    expect(() => parseMoneyInput('abc')).toThrow(/inválido/);
    expect(() => parseMoneyInput('0')).toThrow(/maior que zero/);
  });

  it('parseMaskedCentsInput treats digits as centavos', () => {
    expect(parseMaskedCentsInput('12345')).toBe('12345');
    expect(parseMaskedCentsInput('100')).toBe('100');
    expect(() => parseMaskedCentsInput('')).toThrow(/vazio/);
  });

  it('formatCentsBrl never uses parseFloat', () => {
    expect(formatCentsBrl('1050')).toBe('10,50');
    expect(formatCentsBrl('123456')).toBe('1.234,56');
    expect(formatCentsCurrency('99')).toBe('R$ 0,99');
  });

  it('compareCents orders ledger amounts', () => {
    expect(compareCents('100', '200')).toBe(-1);
    expect(compareCents('500', '500')).toBe(0);
    expect(compareCents('900', '100')).toBe(1);
  });

  it('createIdempotencyKey is unique and scoped', () => {
    const pix = createIdempotencyKey('pix');
    const transfer = createIdempotencyKey('transfer');
    expect(pix).toMatch(/^pix-ui-[0-9a-f-]{36}$/);
    expect(transfer).toMatch(/^transfer-ui-[0-9a-f-]{36}$/);
    expect(pix).not.toBe(transfer);
  });
});