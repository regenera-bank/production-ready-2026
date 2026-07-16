import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  PaymentsAdapterKind,
  PaymentsCommand,
  PaymentsHealth,
  PaymentsPort,
  PaymentsResult,
} from '../../ports/payments.port';

@Injectable()
export class PaymentsProductionAdapter implements PaymentsPort {
  readonly kind: PaymentsAdapterKind = 'production';

  async health(): Promise<PaymentsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('payments', 'production');
  }

  async execute(_command: PaymentsCommand): Promise<PaymentsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('payments', 'production');
  }
}
