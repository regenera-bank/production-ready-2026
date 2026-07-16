import { Inject, Injectable } from '@nestjs/common';
import { INSURANCE_PORT, InsuranceCommand, InsurancePort, InsuranceResult } from './ports/insurance.port';

@Injectable()
export class InsuranceService {
  constructor(@Inject(INSURANCE_PORT) private readonly port: InsurancePort) {}

  health() {
    return this.port.health();
  }

  execute(command: InsuranceCommand): Promise<InsuranceResult> {
    return this.port.execute(command);
  }
}
