import { Inject, Injectable } from '@nestjs/common';
import { SUSTAINABILITY_PORT, SustainabilityCommand, SustainabilityPort, SustainabilityResult } from './ports/sustainability.port';

@Injectable()
export class SustainabilityService {
  constructor(@Inject(SUSTAINABILITY_PORT) private readonly port: SustainabilityPort) {}

  health() {
    return this.port.health();
  }

  execute(command: SustainabilityCommand): Promise<SustainabilityResult> {
    return this.port.execute(command);
  }
}
