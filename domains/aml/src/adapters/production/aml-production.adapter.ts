import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  AmlAdapterKind,
  AmlCommand,
  AmlHealth,
  AmlPort,
  AmlResult,
} from '../../ports/aml.port';

@Injectable()
export class AmlProductionAdapter implements AmlPort {
  readonly kind: AmlAdapterKind = 'production';

  async health(): Promise<AmlHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('aml', 'production');
  }

  async execute(_command: AmlCommand): Promise<AmlResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('aml', 'production');
  }
}
