import { Inject, Injectable } from '@nestjs/common';
import { AML_PORT, AmlCommand, AmlPort, AmlResult } from './ports/aml.port';

@Injectable()
export class AmlService {
  constructor(@Inject(AML_PORT) private readonly port: AmlPort) {}

  health() {
    return this.port.health();
  }

  execute(command: AmlCommand): Promise<AmlResult> {
    return this.port.execute(command);
  }
}
