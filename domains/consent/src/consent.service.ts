import { Inject, Injectable } from '@nestjs/common';
import { CONSENT_PORT, ConsentCommand, ConsentPort, ConsentResult } from './ports/consent.port';

@Injectable()
export class ConsentService {
  constructor(@Inject(CONSENT_PORT) private readonly port: ConsentPort) {}

  health() {
    return this.port.health();
  }

  execute(command: ConsentCommand): Promise<ConsentResult> {
    return this.port.execute(command);
  }
}
