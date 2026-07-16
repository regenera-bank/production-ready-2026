import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  InsuranceAdapterKind,
  InsuranceCommand,
  InsuranceHealth,
  InsurancePort,
  InsuranceResult,
} from '../../ports/insurance.port';

@Injectable()
export class InsuranceProductionAdapter implements InsurancePort {
  readonly kind: InsuranceAdapterKind = 'production';

  async health(): Promise<InsuranceHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('insurance', 'production');
  }

  async execute(_command: InsuranceCommand): Promise<InsuranceResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('insurance', 'production');
  }
}
