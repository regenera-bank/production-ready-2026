import { Inject, Injectable } from '@nestjs/common';
import { CARD_INVOICES_PORT, CardInvoicesCommand, CardInvoicesPort, CardInvoicesResult } from './ports/card-invoices.port';

@Injectable()
export class CardInvoicesService {
  constructor(@Inject(CARD_INVOICES_PORT) private readonly port: CardInvoicesPort) {}

  health() {
    return this.port.health();
  }

  execute(command: CardInvoicesCommand): Promise<CardInvoicesResult> {
    return this.port.execute(command);
  }
}
