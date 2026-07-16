import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  ReconciliationAdapterKind,
  ReconciliationCommand,
  ReconciliationHealth,
  ReconciliationPort,
  ReconciliationResult,
} from '../../ports/reconciliation.port';

@Injectable()
export class ReconciliationProductionAdapter implements ReconciliationPort {
  readonly kind: ReconciliationAdapterKind = 'production';

  async health(): Promise<ReconciliationHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('reconciliation', 'production');
  }

  async execute(_command: ReconciliationCommand): Promise<ReconciliationResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('reconciliation', 'production');
  }
}
