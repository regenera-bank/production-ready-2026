import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  LimitsAdapterKind,
  LimitsCommand,
  LimitsHealth,
  LimitsPort,
  LimitsResult,
} from '../../ports/limits.port';

@Injectable()
export class LimitsProductionAdapter implements LimitsPort {
  readonly kind: LimitsAdapterKind = 'production';

  async health(): Promise<LimitsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('limits', 'production');
  }

  async execute(_command: LimitsCommand): Promise<LimitsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('limits', 'production');
  }
}
