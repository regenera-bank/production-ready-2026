import { Inject, Injectable } from '@nestjs/common';
import { CREDIT_PORT, CreditCommand, CreditPort, CreditResult } from './ports/credit.port';

@Injectable()
export class CreditService {
  constructor(@Inject(CREDIT_PORT) private readonly port: CreditPort) {}

  health() {
    return this.port.health();
  }

  execute(command: CreditCommand): Promise<CreditResult> {
    return this.port.execute(command);
  }
}
