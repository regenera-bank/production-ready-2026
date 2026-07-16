import { Inject, Injectable } from '@nestjs/common';
import { SUITABILITY_PORT, SuitabilityCommand, SuitabilityPort, SuitabilityResult } from './ports/suitability.port';

@Injectable()
export class SuitabilityService {
  constructor(@Inject(SUITABILITY_PORT) private readonly port: SuitabilityPort) {}

  health() {
    return this.port.health();
  }

  execute(command: SuitabilityCommand): Promise<SuitabilityResult> {
    return this.port.execute(command);
  }
}
