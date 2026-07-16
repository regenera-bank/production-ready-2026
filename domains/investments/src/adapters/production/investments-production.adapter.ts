import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  InvestmentsAdapterKind,
  InvestmentsCommand,
  InvestmentsHealth,
  InvestmentsPort,
  InvestmentsResult,
} from '../../ports/investments.port';

@Injectable()
export class InvestmentsProductionAdapter implements InvestmentsPort {
  readonly kind: InvestmentsAdapterKind = 'production';

  async health(): Promise<InvestmentsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('investments', 'production');
  }

  async execute(_command: InvestmentsCommand): Promise<InvestmentsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('investments', 'production');
  }
}
