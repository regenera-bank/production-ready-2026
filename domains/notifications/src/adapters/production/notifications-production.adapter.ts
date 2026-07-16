import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  NotificationsAdapterKind,
  NotificationsCommand,
  NotificationsHealth,
  NotificationsPort,
  NotificationsResult,
} from '../../ports/notifications.port';

@Injectable()
export class NotificationsProductionAdapter implements NotificationsPort {
  readonly kind: NotificationsAdapterKind = 'production';

  async health(): Promise<NotificationsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('notifications', 'production');
  }

  async execute(_command: NotificationsCommand): Promise<NotificationsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('notifications', 'production');
  }
}
