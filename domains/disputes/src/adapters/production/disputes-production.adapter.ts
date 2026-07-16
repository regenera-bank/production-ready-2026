import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  DisputesAdapterKind,
  DisputesCommand,
  DisputesHealth,
  DisputesPort,
  DisputesResult,
} from '../../ports/disputes.port';

@Injectable()
export class DisputesProductionAdapter implements DisputesPort {
  readonly kind: DisputesAdapterKind = 'production';

  async health(): Promise<DisputesHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('disputes', 'production');
  }

  async execute(_command: DisputesCommand): Promise<DisputesResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('disputes', 'production');
  }
}
