import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  AccountingAdapterKind,
  AccountingCommand,
  AccountingHealth,
  AccountingPort,
  AccountingResult,
} from '../../ports/accounting.port';

@Injectable()
export class AccountingProductionAdapter implements AccountingPort {
  readonly kind: AccountingAdapterKind = 'production';

  async health(): Promise<AccountingHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('accounting', 'production');
  }

  async execute(_command: AccountingCommand): Promise<AccountingResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('accounting', 'production');
  }
}
