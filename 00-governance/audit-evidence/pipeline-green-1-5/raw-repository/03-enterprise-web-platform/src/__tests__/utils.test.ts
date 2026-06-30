import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatPercent, maskSecureData } from '../shared/lib/utils';

describe('Utility Functions (utils.ts)', () => {
  it('cn should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('class1', false && 'class2')).toBe('class1');
  });

  it('formatCurrency should format numbers to BRL currency string', () => {
    // We match BRL currency format using regex or substring to be locale-resilient
    const formatted = formatCurrency(1234.56);
    expect(formatted).toContain('1.234,56');
  });

  it('formatPercent should format numbers to percentage string', () => {
    const formatted = formatPercent(12.34);
    expect(formatted).toContain('12,34');
  });

  it('maskSecureData should mask data except visible digits', () => {
    expect(maskSecureData('1234567890', 4)).toBe('••••••7890');
    expect(maskSecureData('12', 4)).toBe('12');
  });
});
