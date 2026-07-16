import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  LedgerAdapterKind,
  LedgerCommand,
  LedgerHealth,
  LedgerPort,
  LedgerResult,
} from '../../ports/ledger.port';

@Injectable()
export class LedgerProductionAdapter implements LedgerPort {
  readonly kind: LedgerAdapterKind = 'production';

  async health(): Promise<LedgerHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('ledger', 'production');
  }

  async execute(_command: LedgerCommand): Promise<LedgerResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('ledger', 'production');
  }
}
