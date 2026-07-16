import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  SanctionsAdapterKind,
  SanctionsCommand,
  SanctionsHealth,
  SanctionsPort,
  SanctionsResult,
} from '../../ports/sanctions.port';

@Injectable()
export class SanctionsProductionAdapter implements SanctionsPort {
  readonly kind: SanctionsAdapterKind = 'production';

  async health(): Promise<SanctionsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('sanctions', 'production');
  }

  async execute(_command: SanctionsCommand): Promise<SanctionsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('sanctions', 'production');
  }
}
