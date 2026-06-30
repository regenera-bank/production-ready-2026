import { Inject, Injectable } from '@nestjs/common';
import { KIDS_PORT, KidsCommand, KidsPort, KidsResult } from './ports/kids.port';

@Injectable()
export class KidsService {
  constructor(@Inject(KIDS_PORT) private readonly port: KidsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: KidsCommand): Promise<KidsResult> {
    return this.port.execute(command);
  }
}
