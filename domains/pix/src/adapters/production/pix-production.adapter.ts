import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  PixAdapterKind,
  PixCommand,
  PixHealth,
  PixPort,
  PixResult,
} from '../../ports/pix.port';

@Injectable()
export class PixProductionAdapter implements PixPort {
  readonly kind: PixAdapterKind = 'production';

  async health(): Promise<PixHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('pix', 'production');
  }

  async execute(_command: PixCommand): Promise<PixResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('pix', 'production');
  }
}
