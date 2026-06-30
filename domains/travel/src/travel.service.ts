import { Inject, Injectable } from '@nestjs/common';
import { TRAVEL_PORT, TravelCommand, TravelPort, TravelResult } from './ports/travel.port';

@Injectable()
export class TravelService {
  constructor(@Inject(TRAVEL_PORT) private readonly port: TravelPort) {}

  health() {
    return this.port.health();
  }

  execute(command: TravelCommand): Promise<TravelResult> {
    return this.port.execute(command);
  }
}
