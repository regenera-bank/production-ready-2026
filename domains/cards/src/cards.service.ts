import { Inject, Injectable } from '@nestjs/common';
import { CARDS_PORT, CardsCommand, CardsPort, CardsResult } from './ports/cards.port';

@Injectable()
export class CardsService {
  constructor(@Inject(CARDS_PORT) private readonly port: CardsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: CardsCommand): Promise<CardsResult> {
    return this.port.execute(command);
  }
}
