import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  CreditAdapterKind,
  CreditCommand,
  CreditHealth,
  CreditPort,
  CreditResult,
} from '../../ports/credit.port';

@Injectable()
export class CreditProductionAdapter implements CreditPort {
  readonly kind: CreditAdapterKind = 'production';

  async health(): Promise<CreditHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('credit', 'production');
  }

  async execute(_command: CreditCommand): Promise<CreditResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('credit', 'production');
  }
}
