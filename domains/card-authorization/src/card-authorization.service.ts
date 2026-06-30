import { Inject, Injectable } from '@nestjs/common';
import { CARD_AUTHORIZATION_PORT, CardAuthorizationCommand, CardAuthorizationPort, CardAuthorizationResult } from './ports/card-authorization.port';

@Injectable()
export class CardAuthorizationService {
  constructor(@Inject(CARD_AUTHORIZATION_PORT) private readonly port: CardAuthorizationPort) {}

  health() {
    return this.port.health();
  }

  execute(command: CardAuthorizationCommand): Promise<CardAuthorizationResult> {
    return this.port.execute(command);
  }
}
