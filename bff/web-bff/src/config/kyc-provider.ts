/** Provedores que ativam esteira KYC de homologação (sem Prometeo/Serpro real). */
export const HOMOLOG_KYC_PROVIDERS = new Set(['firebase', 'homolog']);

export const normalizeKycProvider = (
  raw = process.env.KYC_PROVIDER,
): string => raw?.trim().toLowerCase() ?? 'firebase';

export const isHomologKycProvider = (provider = normalizeKycProvider()): boolean =>
  HOMOLOG_KYC_PROVIDERS.has(provider);

export const isFirebaseHomologKyc = (provider = normalizeKycProvider()): boolean =>
  provider === 'firebase';