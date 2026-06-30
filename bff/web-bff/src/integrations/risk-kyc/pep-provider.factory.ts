import type { Provider } from '@nestjs/common';
import { HomologPepProvider } from './homolog-pep.provider';
import { PepApiProvider } from './pep-api.provider';
import { PrometeoIdentityClient } from './prometeo-identity.client';
import { PrometeoPepProvider } from './prometeo-pep.provider';

const pepConfigured = (): boolean =>
  Boolean(
    process.env.PEP_API_URL?.trim() && process.env.PEP_API_KEY?.trim(),
  );

const homologKyc = (): boolean => {
  const provider = process.env.KYC_PROVIDER?.trim().toLowerCase();
  return provider === 'firebase' || provider === 'homolog';
};

export const pepProviderFactory: Provider = {
  provide: 'PEP_PROVIDER',
  useFactory: (prometeo: PrometeoIdentityClient) => {
    if (homologKyc()) {
      return new HomologPepProvider();
    }
    if (pepConfigured()) {
      return new PepApiProvider();
    }
    return new PrometeoPepProvider(prometeo);
  },
  inject: [PrometeoIdentityClient],
};