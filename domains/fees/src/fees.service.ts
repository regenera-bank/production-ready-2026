import { Inject, Injectable } from '@nestjs/common';
import { FEES_PORT, FeesCommand, FeesPort, FeesResult } from './ports/fees.port';

@Injectable()
export class FeesService {
  constructor(@Inject(FEES_PORT) private readonly port: FeesPort) {}

  health() {
    return this.port.health();
  }

  execute(command: FeesCommand): Promise<FeesResult> {
    return this.port.execute(command);
  }
}
