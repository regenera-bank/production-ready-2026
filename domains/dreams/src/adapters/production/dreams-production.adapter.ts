import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  DreamsAdapterKind,
  DreamsCommand,
  DreamsHealth,
  DreamsPort,
  DreamsResult,
} from '../../ports/dreams.port';

@Injectable()
export class DreamsProductionAdapter implements DreamsPort {
  readonly kind: DreamsAdapterKind = 'production';

  async health(): Promise<DreamsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('dreams', 'production');
  }

  async execute(_command: DreamsCommand): Promise<DreamsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('dreams', 'production');
  }
}
