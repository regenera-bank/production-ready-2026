import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  SustainabilityAdapterKind,
  SustainabilityCommand,
  SustainabilityHealth,
  SustainabilityPort,
  SustainabilityResult,
} from '../../ports/sustainability.port';

@Injectable()
export class SustainabilityProductionAdapter implements SustainabilityPort {
  readonly kind: SustainabilityAdapterKind = 'production';

  async health(): Promise<SustainabilityHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('sustainability', 'production');
  }

  async execute(_command: SustainabilityCommand): Promise<SustainabilityResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('sustainability', 'production');
  }
}
