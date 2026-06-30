import { describe, it, expect } from 'vitest';

function validateCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  // Simple check for all same digits
  if (/^(\d)\1+$/.test(clean)) return false;
  return true;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

describe('Form Validation Helper Functions', () => {
  it('correctly validates CPF numbers', () => {
    expect(validateCpf('12345678901')).toBe(true);
    expect(validateCpf('11111111111')).toBe(false);
    expect(validateCpf('123')).toBe(false);
  });

  it('correctly validates email formats', () => {
    expect(validateEmail('test@regenerabank.app')).toBe(true);
    expect(validateEmail('test@domain')).toBe(false);
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
