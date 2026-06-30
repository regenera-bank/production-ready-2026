import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  FraudAdapterKind,
  FraudCommand,
  FraudHealth,
  FraudPort,
  FraudResult,
} from '../../ports/fraud.port';

@Injectable()
export class FraudProductionAdapter implements FraudPort {
  readonly kind: FraudAdapterKind = 'production';

  async health(): Promise<FraudHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('fraud', 'production');
  }

  async execute(_command: FraudCommand): Promise<FraudResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('fraud', 'production');
  }
}
