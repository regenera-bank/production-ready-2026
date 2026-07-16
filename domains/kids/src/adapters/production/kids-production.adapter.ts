import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  KidsAdapterKind,
  KidsCommand,
  KidsHealth,
  KidsPort,
  KidsResult,
} from '../../ports/kids.port';

@Injectable()
export class KidsProductionAdapter implements KidsPort {
  readonly kind: KidsAdapterKind = 'production';

  async health(): Promise<KidsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('kids', 'production');
  }

  async execute(_command: KidsCommand): Promise<KidsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('kids', 'production');
  }
}
