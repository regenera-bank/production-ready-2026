import type { Provider } from '@nestjs/common';
import {
  isDiditKycProvider,
  isHomologKycProvider,
} from '../../config/kyc-provider';
import { HomologPepProvider } from './homolog-pep.provider';
import { PepApiProvider } from './pep-api.provider';
import { PrometeoIdentityClient } from './prometeo-identity.client';
import { PrometeoPepProvider } from './prometeo-pep.provider';

const pepConfigured = (): boolean =>
  Boolean(
    process.env.PEP_API_URL?.trim() && process.env.PEP_API_KEY?.trim(),
  );

export const pepProviderFactory: Provider = {
  provide: 'PEP_PROVIDER',
  useFactory: (prometeo: PrometeoIdentityClient) => {
    if (isHomologKycProvider() || isDiditKycProvider()) {
      return new HomologPepProvider();
    }
    if (pepConfigured()) {
      return new PepApiProvider();
    }
    return new PrometeoPepProvider(prometeo);
  },
  inject: [PrometeoIdentityClient],
};