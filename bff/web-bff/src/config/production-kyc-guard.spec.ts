import {
  assertProductionKycSafe,
  ProductionKycGuardError,
} from './production-kyc-guard';

const envSnapshot = (): NodeJS.ProcessEnv => ({ ...process.env });

describe('assertProductionKycSafe', () => {
  let saved: NodeJS.ProcessEnv;

  beforeEach(() => {
    saved = envSnapshot();
    delete process.env.NODE_ENV;
    delete process.env.KYC_PROVIDER;
    delete process.env.ALLOW_HOMOLOG_KYC;
  });

  afterEach(() => {
    process.env = saved;
  });

  it('permite homolog fora de production sem flag', () => {
    process.env.NODE_ENV = 'development';
    process.env.KYC_PROVIDER = 'homolog';
    expect(() => assertProductionKycSafe()).not.toThrow();
  });

  it('permite firebase homolog em test', () => {
    process.env.NODE_ENV = 'test';
    process.env.KYC_PROVIDER = 'firebase';
    expect(() => assertProductionKycSafe()).not.toThrow();
  });

  it('rejeita KYC_PROVIDER=homolog em production sem override', () => {
    process.env.NODE_ENV = 'production';
    process.env.KYC_PROVIDER = 'homolog';
    expect(() => assertProductionKycSafe()).toThrow(ProductionKycGuardError);
    expect(() => assertProductionKycSafe()).toThrow(/homolog.*proibido/i);
  });

  it('rejeita firebase homolog em production', () => {
    process.env.NODE_ENV = 'production';
    process.env.KYC_PROVIDER = 'firebase';
    expect(() => assertProductionKycSafe()).toThrow(ProductionKycGuardError);
    expect(() => assertProductionKycSafe()).toThrow(/bloqueado em NODE_ENV=production/i);
  });

  it('rejeita ALLOW_HOMOLOG_KYC=true em production mesmo com prometeo ausente', () => {
    process.env.NODE_ENV = 'production';
    process.env.KYC_PROVIDER = 'firebase';
    process.env.ALLOW_HOMOLOG_KYC = 'true';
    expect(() => assertProductionKycSafe()).toThrow(ProductionKycGuardError);
    expect(() => assertProductionKycSafe()).toThrow(/ALLOW_HOMOLOG_KYC=true não é válido/i);
  });

  it('permite KYC_PROVIDER=prometeo em production', () => {
    process.env.NODE_ENV = 'production';
    process.env.KYC_PROVIDER = 'prometeo';
    expect(() => assertProductionKycSafe()).not.toThrow();
  });
});