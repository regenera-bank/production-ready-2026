import { maskCpf, maskUserId, redactSensitiveLogPayload } from './pii-redaction';

describe('pii-redaction', () => {
  it('mascara CPF completo', () => {
    expect(maskCpf('529.982.247-25')).toBe('***.982.***-25');
    expect(maskCpf('52998224725')).toBe('***.982.***-25');
  });

  it('mascara userId numérico como CPF', () => {
    expect(maskUserId('39053344705')).toBe('***.533.***-05');
  });

  it('remove base64 de imagens em logs', () => {
    const payload = `erro selfie data:image/png;base64,${'A'.repeat(400)}`;
    const redacted = redactSensitiveLogPayload(payload);
    expect(redacted).not.toContain('AAAA');
    expect(redacted).toContain('[REDACTED_BINARY]');
  });
});