import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  FeesAdapterKind,
  FeesCommand,
  FeesHealth,
  FeesPort,
  FeesResult,
} from '../../ports/fees.port';

@Injectable()
export class FeesProductionAdapter implements FeesPort {
  readonly kind: FeesAdapterKind = 'production';

  async health(): Promise<FeesHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('fees', 'production');
  }

  async execute(_command: FeesCommand): Promise<FeesResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('fees', 'production');
  }
}
