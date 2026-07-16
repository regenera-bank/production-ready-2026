import { Inject, Injectable } from '@nestjs/common';
import { PETS_PORT, PetsCommand, PetsPort, PetsResult } from './ports/pets.port';

@Injectable()
export class PetsService {
  constructor(@Inject(PETS_PORT) private readonly port: PetsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: PetsCommand): Promise<PetsResult> {
    return this.port.execute(command);
  }
}
