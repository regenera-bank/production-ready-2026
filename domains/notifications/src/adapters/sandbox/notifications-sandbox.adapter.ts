import { Injectable } from '@nestjs/common';
import {
  NotificationsAdapterKind,
  NotificationsCommand,
  NotificationsHealth,
  NotificationsPort,
  NotificationsResult,
} from '../../ports/notifications.port';

@Injectable()
export class NotificationsSandboxAdapter implements NotificationsPort {
  readonly kind: NotificationsAdapterKind = 'sandbox';
  private readonly store = new Map<string, NotificationsResult>();

  async health(): Promise<NotificationsHealth> {
    return { ok: true, domain: 'notifications', adapter: 'sandbox' };
  }

  async execute(command: NotificationsCommand): Promise<NotificationsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: NotificationsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
