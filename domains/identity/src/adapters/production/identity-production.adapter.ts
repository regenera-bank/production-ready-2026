import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  IdentityAdapterKind,
  IdentityCommand,
  IdentityHealth,
  IdentityPort,
  IdentityResult,
} from '../../ports/identity.port';

@Injectable()
export class IdentityProductionAdapter implements IdentityPort {
  readonly kind: IdentityAdapterKind = 'production';

  async health(): Promise<IdentityHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('identity', 'production');
  }

  async execute(_command: IdentityCommand): Promise<IdentityResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('identity', 'production');
  }
}
