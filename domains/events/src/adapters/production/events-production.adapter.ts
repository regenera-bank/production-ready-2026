import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  EventsAdapterKind,
  EventsCommand,
  EventsHealth,
  EventsPort,
  EventsResult,
} from '../../ports/events.port';

@Injectable()
export class EventsProductionAdapter implements EventsPort {
  readonly kind: EventsAdapterKind = 'production';

  async health(): Promise<EventsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('events', 'production');
  }

  async execute(_command: EventsCommand): Promise<EventsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('events', 'production');
  }
}
