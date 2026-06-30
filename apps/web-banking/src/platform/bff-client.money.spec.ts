import { describe, expect, it } from 'vitest';
import { centsToReais, mapTransactionDto, reaisToCents } from './bff-client';
import { parseMoneyInput } from './money';

describe('bff-client money contract', () => {
  it('reaisToCents delegates to safe cent strings', () => {
    expect(reaisToCents(parseMoneyInput('10,50'))).toBe('1050');
    expect(reaisToCents('123456')).toBe('123456');
  });

  it('centsToReais is display-only', () => {
    expect(centsToReais('1050')).toBe(10.5);
    expect(centsToReais(99)).toBe(0.99);
  });

  it('mapTransactionDto preserves BFF cent precision', () => {
    const dto = {
      id: 'tx-1',
      title: 'Pix enviado',
      party: 'Maria',
      date: '2026-06-30T12:00:00.000Z',
      amountCents: '1050',
      type: 'outflow' as const,
      channel: 'pix' as const,
      icon: 'zap',
      category: 'essential' as const,
    };
    const mapped = mapTransactionDto(dto);
    expect(mapped.amount).toBe(10.5);
    expect(mapped.channel).toBe('pix');
  });
});