import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  SuitabilityAdapterKind,
  SuitabilityCommand,
  SuitabilityHealth,
  SuitabilityPort,
  SuitabilityResult,
} from '../../ports/suitability.port';

@Injectable()
export class SuitabilityProductionAdapter implements SuitabilityPort {
  readonly kind: SuitabilityAdapterKind = 'production';

  async health(): Promise<SuitabilityHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('suitability', 'production');
  }

  async execute(_command: SuitabilityCommand): Promise<SuitabilityResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('suitability', 'production');
  }
}
