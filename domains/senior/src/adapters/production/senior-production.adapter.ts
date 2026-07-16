import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  SeniorAdapterKind,
  SeniorCommand,
  SeniorHealth,
  SeniorPort,
  SeniorResult,
} from '../../ports/senior.port';

@Injectable()
export class SeniorProductionAdapter implements SeniorPort {
  readonly kind: SeniorAdapterKind = 'production';

  async health(): Promise<SeniorHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('senior', 'production');
  }

  async execute(_command: SeniorCommand): Promise<SeniorResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('senior', 'production');
  }
}
