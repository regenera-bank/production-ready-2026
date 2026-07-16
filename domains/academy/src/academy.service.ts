import { Inject, Injectable } from '@nestjs/common';
import { ACADEMY_PORT, AcademyCommand, AcademyPort, AcademyResult } from './ports/academy.port';

@Injectable()
export class AcademyService {
  constructor(@Inject(ACADEMY_PORT) private readonly port: AcademyPort) {}

  health() {
    return this.port.health();
  }

  execute(command: AcademyCommand): Promise<AcademyResult> {
    return this.port.execute(command);
  }
}
