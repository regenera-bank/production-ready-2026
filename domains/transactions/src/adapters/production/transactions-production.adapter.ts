import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  TransactionsAdapterKind,
  TransactionsCommand,
  TransactionsHealth,
  TransactionsPort,
  TransactionsResult,
} from '../../ports/transactions.port';

@Injectable()
export class TransactionsProductionAdapter implements TransactionsPort {
  readonly kind: TransactionsAdapterKind = 'production';

  async health(): Promise<TransactionsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('transactions', 'production');
  }

  async execute(_command: TransactionsCommand): Promise<TransactionsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('transactions', 'production');
  }
}
