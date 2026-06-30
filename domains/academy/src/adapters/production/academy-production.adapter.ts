import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  AcademyAdapterKind,
  AcademyCommand,
  AcademyHealth,
  AcademyPort,
  AcademyResult,
} from '../../ports/academy.port';

@Injectable()
export class AcademyProductionAdapter implements AcademyPort {
  readonly kind: AcademyAdapterKind = 'production';

  async health(): Promise<AcademyHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('academy', 'production');
  }

  async execute(_command: AcademyCommand): Promise<AcademyResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('academy', 'production');
  }
}
