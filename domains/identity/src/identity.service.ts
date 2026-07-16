import { Inject, Injectable } from '@nestjs/common';
import { IDENTITY_PORT, IdentityCommand, IdentityPort, IdentityResult } from './ports/identity.port';

@Injectable()
export class IdentityService {
  constructor(@Inject(IDENTITY_PORT) private readonly port: IdentityPort) {}

  health() {
    return this.port.health();
  }

  execute(command: IdentityCommand): Promise<IdentityResult> {
    return this.port.execute(command);
  }
}
