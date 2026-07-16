import {
  isFirebaseHomologKyc,
  isHomologKycProvider,
  normalizeKycProvider,
} from './kyc-provider';

export class ProductionKycGuardError extends Error {
  readonly code = 'PRODUCTION_KYC_GUARD';

  constructor(message: string) {
    super(message);
    this.name = 'ProductionKycGuardError';
  }
}

const allowHomologKycFlag = (): boolean =>
  process.env.ALLOW_HOMOLOG_KYC?.trim().toLowerCase() === 'true';

const isProductionNode = (): boolean =>
  process.env.NODE_ENV?.trim().toLowerCase() === 'production';

/**
 * Bloqueia subida do BFF com KYC de homologação em ambiente de produção.
 *
 * - `KYC_PROVIDER=homolog` → sempre recusado em production (sem override).
 * - `KYC_PROVIDER=firebase` (modo KYC homolog) → recusado em production.
 * - `KYC_PROVIDER=didit` → permitido em production (provedor externo real).
 * - `ALLOW_HOMOLOG_KYC=true` só vale fora de production (flag explícita de não-prod).
 */
export function assertProductionKycSafe(): void {
  const provider = normalizeKycProvider();

  if (!isProductionNode()) {
    if (isHomologKycProvider(provider) && !allowHomologKycFlag()) {
      console.warn(
        `⚠ KYC_PROVIDER=${provider} (homolog) ativo — defina ALLOW_HOMOLOG_KYC=true para confirmar ambiente não-produtivo.`,
      );
    }
    return;
  }

  if (provider === 'homolog') {
    throw new ProductionKycGuardError(
      'KYC_PROVIDER=homolog é proibido com NODE_ENV=production (sem override). Use KYC_PROVIDER=prometeo.',
    );
  }

  if (isFirebaseHomologKyc(provider) || isHomologKycProvider(provider)) {
    if (allowHomologKycFlag()) {
      throw new ProductionKycGuardError(
        'ALLOW_HOMOLOG_KYC=true não é válido em NODE_ENV=production. Remova a flag ou use KYC_PROVIDER=prometeo.',
      );
    }
    throw new ProductionKycGuardError(
      'KYC_PROVIDER=firebase ativa esteira KYC homolog — bloqueado em NODE_ENV=production. Use KYC_PROVIDER=prometeo.',
    );
  }
}