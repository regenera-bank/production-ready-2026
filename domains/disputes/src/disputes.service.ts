import { Inject, Injectable } from '@nestjs/common';
import { DISPUTES_PORT, DisputesCommand, DisputesPort, DisputesResult } from './ports/disputes.port';

@Injectable()
export class DisputesService {
  constructor(@Inject(DISPUTES_PORT) private readonly port: DisputesPort) {}

  health() {
    return this.port.health();
  }

  execute(command: DisputesCommand): Promise<DisputesResult> {
    return this.port.execute(command);
  }
}
