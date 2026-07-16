import { Inject, Injectable } from '@nestjs/common';
import { LEDGER_PORT, LedgerCommand, LedgerPort, LedgerResult } from './ports/ledger.port';

@Injectable()
export class LedgerService {
  constructor(@Inject(LEDGER_PORT) private readonly port: LedgerPort) {}

  health() {
    return this.port.health();
  }

  execute(command: LedgerCommand): Promise<LedgerResult> {
    return this.port.execute(command);
  }
}
