import { Inject, Injectable } from '@nestjs/common';
import { INVESTMENTS_PORT, InvestmentsCommand, InvestmentsPort, InvestmentsResult } from './ports/investments.port';

@Injectable()
export class InvestmentsService {
  constructor(@Inject(INVESTMENTS_PORT) private readonly port: InvestmentsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: InvestmentsCommand): Promise<InvestmentsResult> {
    return this.port.execute(command);
  }
}
