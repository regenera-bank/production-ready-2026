import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNTS_PORT, AccountsCommand, AccountsPort, AccountsResult } from './ports/accounts.port';

@Injectable()
export class AccountsService {
  constructor(@Inject(ACCOUNTS_PORT) private readonly port: AccountsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: AccountsCommand): Promise<AccountsResult> {
    return this.port.execute(command);
  }
}
