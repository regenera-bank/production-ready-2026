import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  CustodyAdapterKind,
  CustodyCommand,
  CustodyHealth,
  CustodyPort,
  CustodyResult,
} from '../../ports/custody.port';

@Injectable()
export class CustodyProductionAdapter implements CustodyPort {
  readonly kind: CustodyAdapterKind = 'production';

  async health(): Promise<CustodyHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('custody', 'production');
  }

  async execute(_command: CustodyCommand): Promise<CustodyResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('custody', 'production');
  }
}
