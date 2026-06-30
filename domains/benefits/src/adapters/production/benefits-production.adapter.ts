import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  BenefitsAdapterKind,
  BenefitsCommand,
  BenefitsHealth,
  BenefitsPort,
  BenefitsResult,
} from '../../ports/benefits.port';

@Injectable()
export class BenefitsProductionAdapter implements BenefitsPort {
  readonly kind: BenefitsAdapterKind = 'production';

  async health(): Promise<BenefitsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('benefits', 'production');
  }

  async execute(_command: BenefitsCommand): Promise<BenefitsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('benefits', 'production');
  }
}
