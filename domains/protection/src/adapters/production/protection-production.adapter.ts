import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  ProtectionAdapterKind,
  ProtectionCommand,
  ProtectionHealth,
  ProtectionPort,
  ProtectionResult,
} from '../../ports/protection.port';

@Injectable()
export class ProtectionProductionAdapter implements ProtectionPort {
  readonly kind: ProtectionAdapterKind = 'production';

  async health(): Promise<ProtectionHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('protection', 'production');
  }

  async execute(_command: ProtectionCommand): Promise<ProtectionResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('protection', 'production');
  }
}
