import { Inject, Injectable } from '@nestjs/common';
import { DREAMS_PORT, DreamsCommand, DreamsPort, DreamsResult } from './ports/dreams.port';

@Injectable()
export class DreamsService {
  constructor(@Inject(DREAMS_PORT) private readonly port: DreamsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: DreamsCommand): Promise<DreamsResult> {
    return this.port.execute(command);
  }
}
