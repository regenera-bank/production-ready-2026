import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNTING_PORT, AccountingCommand, AccountingPort, AccountingResult } from './ports/accounting.port';

@Injectable()
export class AccountingService {
  constructor(@Inject(ACCOUNTING_PORT) private readonly port: AccountingPort) {}

  health() {
    return this.port.health();
  }

  execute(command: AccountingCommand): Promise<AccountingResult> {
    return this.port.execute(command);
  }
}
