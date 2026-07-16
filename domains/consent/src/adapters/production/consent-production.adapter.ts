import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  ConsentAdapterKind,
  ConsentCommand,
  ConsentHealth,
  ConsentPort,
  ConsentResult,
} from '../../ports/consent.port';

@Injectable()
export class ConsentProductionAdapter implements ConsentPort {
  readonly kind: ConsentAdapterKind = 'production';

  async health(): Promise<ConsentHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('consent', 'production');
  }

  async execute(_command: ConsentCommand): Promise<ConsentResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('consent', 'production');
  }
}
