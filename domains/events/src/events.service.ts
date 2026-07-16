import { Inject, Injectable } from '@nestjs/common';
import { EVENTS_PORT, EventsCommand, EventsPort, EventsResult } from './ports/events.port';

@Injectable()
export class EventsService {
  constructor(@Inject(EVENTS_PORT) private readonly port: EventsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: EventsCommand): Promise<EventsResult> {
    return this.port.execute(command);
  }
}
