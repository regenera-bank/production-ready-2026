import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  AccountsAdapterKind,
  AccountsCommand,
  AccountsHealth,
  AccountsPort,
  AccountsResult,
} from '../../ports/accounts.port';

@Injectable()
export class AccountsProductionAdapter implements AccountsPort {
  readonly kind: AccountsAdapterKind = 'production';

  async health(): Promise<AccountsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('accounts', 'production');
  }

  async execute(_command: AccountsCommand): Promise<AccountsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('accounts', 'production');
  }
}
