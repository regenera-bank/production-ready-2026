import { Inject, Injectable } from '@nestjs/common';
import { BENEFITS_PORT, BenefitsCommand, BenefitsPort, BenefitsResult } from './ports/benefits.port';

@Injectable()
export class BenefitsService {
  constructor(@Inject(BENEFITS_PORT) private readonly port: BenefitsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: BenefitsCommand): Promise<BenefitsResult> {
    return this.port.execute(command);
  }
}
