import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  KycAdapterKind,
  KycCommand,
  KycHealth,
  KycPort,
  KycResult,
} from '../../ports/kyc.port';

@Injectable()
export class KycProductionAdapter implements KycPort {
  readonly kind: KycAdapterKind = 'production';

  async health(): Promise<KycHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('kyc', 'production');
  }

  async execute(_command: KycCommand): Promise<KycResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('kyc', 'production');
  }
}
