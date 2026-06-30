import { Inject, Injectable } from '@nestjs/common';
import { FRAUD_PORT, FraudCommand, FraudPort, FraudResult } from './ports/fraud.port';

@Injectable()
export class FraudService {
  constructor(@Inject(FRAUD_PORT) private readonly port: FraudPort) {}

  health() {
    return this.port.health();
  }

  execute(command: FraudCommand): Promise<FraudResult> {
    return this.port.execute(command);
  }
}
