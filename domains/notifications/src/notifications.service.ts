import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATIONS_PORT, NotificationsCommand, NotificationsPort, NotificationsResult } from './ports/notifications.port';

@Injectable()
export class NotificationsService {
  constructor(@Inject(NOTIFICATIONS_PORT) private readonly port: NotificationsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: NotificationsCommand): Promise<NotificationsResult> {
    return this.port.execute(command);
  }
}
