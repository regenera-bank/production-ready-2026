import { Inject, Injectable } from '@nestjs/common';
import { PAYMENTS_PORT, PaymentsCommand, PaymentsPort, PaymentsResult } from './ports/payments.port';

@Injectable()
export class PaymentsService {
  constructor(@Inject(PAYMENTS_PORT) private readonly port: PaymentsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: PaymentsCommand): Promise<PaymentsResult> {
    return this.port.execute(command);
  }
}
