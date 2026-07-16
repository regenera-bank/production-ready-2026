import { Inject, Injectable } from '@nestjs/common';
import { PROTECTION_PORT, ProtectionCommand, ProtectionPort, ProtectionResult } from './ports/protection.port';

@Injectable()
export class ProtectionService {
  constructor(@Inject(PROTECTION_PORT) private readonly port: ProtectionPort) {}

  health() {
    return this.port.health();
  }

  execute(command: ProtectionCommand): Promise<ProtectionResult> {
    return this.port.execute(command);
  }
}
