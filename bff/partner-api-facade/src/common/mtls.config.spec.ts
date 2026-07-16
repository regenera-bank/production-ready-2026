import { mtlsConfigSpec } from './mtls.config';

describe('mtlsConfigSpec', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('requires mTLS in production mode', () => {
    process.env.PARTNER_SANDBOX_MODE = 'false';
    process.env.PARTNER_MTLS_REQUIRED = 'true';
    const spec = mtlsConfigSpec();
    expect(spec.required).toBe(true);
    expect(spec.certificateBinding).toBe('x5t#S256');
  });

  it('allows optional mTLS in sandbox', () => {
    process.env.PARTNER_SANDBOX_MODE = 'true';
    process.env.PARTNER_MTLS_REQUIRED = 'false';
    const spec = mtlsConfigSpec();
    expect(spec.required).toBe(false);
  });
});