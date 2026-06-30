import { Inject, Injectable } from '@nestjs/common';
import { SANCTIONS_PORT, SanctionsCommand, SanctionsPort, SanctionsResult } from './ports/sanctions.port';

@Injectable()
export class SanctionsService {
  constructor(@Inject(SANCTIONS_PORT) private readonly port: SanctionsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: SanctionsCommand): Promise<SanctionsResult> {
    return this.port.execute(command);
  }
}
