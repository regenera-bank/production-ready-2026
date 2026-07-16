import { Inject, Injectable } from '@nestjs/common';
import { RECONCILIATION_PORT, ReconciliationCommand, ReconciliationPort, ReconciliationResult } from './ports/reconciliation.port';

@Injectable()
export class ReconciliationService {
  constructor(@Inject(RECONCILIATION_PORT) private readonly port: ReconciliationPort) {}

  health() {
    return this.port.health();
  }

  execute(command: ReconciliationCommand): Promise<ReconciliationResult> {
    return this.port.execute(command);
  }
}
