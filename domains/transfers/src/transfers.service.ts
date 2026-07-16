import { Inject, Injectable } from '@nestjs/common';
import { TRANSFERS_PORT, TransfersCommand, TransfersPort, TransfersResult } from './ports/transfers.port';

@Injectable()
export class TransfersService {
  constructor(@Inject(TRANSFERS_PORT) private readonly port: TransfersPort) {}

  health() {
    return this.port.health();
  }

  execute(command: TransfersCommand): Promise<TransfersResult> {
    return this.port.execute(command);
  }
}
