import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  TransfersAdapterKind,
  TransfersCommand,
  TransfersHealth,
  TransfersPort,
  TransfersResult,
} from '../../ports/transfers.port';

@Injectable()
export class TransfersProductionAdapter implements TransfersPort {
  readonly kind: TransfersAdapterKind = 'production';

  async health(): Promise<TransfersHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('transfers', 'production');
  }

  async execute(_command: TransfersCommand): Promise<TransfersResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('transfers', 'production');
  }
}
