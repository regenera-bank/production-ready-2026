import { Inject, Injectable } from '@nestjs/common';
import { SENIOR_PORT, SeniorCommand, SeniorPort, SeniorResult } from './ports/senior.port';

@Injectable()
export class SeniorService {
  constructor(@Inject(SENIOR_PORT) private readonly port: SeniorPort) {}

  health() {
    return this.port.health();
  }

  execute(command: SeniorCommand): Promise<SeniorResult> {
    return this.port.execute(command);
  }
}
