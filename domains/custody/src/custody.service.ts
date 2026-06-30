import { Inject, Injectable } from '@nestjs/common';
import { CUSTODY_PORT, CustodyCommand, CustodyPort, CustodyResult } from './ports/custody.port';

@Injectable()
export class CustodyService {
  constructor(@Inject(CUSTODY_PORT) private readonly port: CustodyPort) {}

  health() {
    return this.port.health();
  }

  execute(command: CustodyCommand): Promise<CustodyResult> {
    return this.port.execute(command);
  }
}
