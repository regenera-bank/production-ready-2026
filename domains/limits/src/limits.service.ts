import { Inject, Injectable } from '@nestjs/common';
import { LIMITS_PORT, LimitsCommand, LimitsPort, LimitsResult } from './ports/limits.port';

@Injectable()
export class LimitsService {
  constructor(@Inject(LIMITS_PORT) private readonly port: LimitsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: LimitsCommand): Promise<LimitsResult> {
    return this.port.execute(command);
  }
}
