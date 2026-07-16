import { Inject, Injectable } from '@nestjs/common';
import { TRANSACTIONS_PORT, TransactionsCommand, TransactionsPort, TransactionsResult } from './ports/transactions.port';

@Injectable()
export class TransactionsService {
  constructor(@Inject(TRANSACTIONS_PORT) private readonly port: TransactionsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: TransactionsCommand): Promise<TransactionsResult> {
    return this.port.execute(command);
  }
}
