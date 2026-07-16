import { Inject, Injectable } from '@nestjs/common';
import { PIX_PORT, PixCommand, PixPort, PixResult } from './ports/pix.port';

@Injectable()
export class PixService {
  constructor(@Inject(PIX_PORT) private readonly port: PixPort) {}

  health() {
    return this.port.health();
  }

  execute(command: PixCommand): Promise<PixResult> {
    return this.port.execute(command);
  }
}
