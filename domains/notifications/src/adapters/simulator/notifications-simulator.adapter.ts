import { Injectable } from '@nestjs/common';
import {
  NotificationsAdapterKind,
  NotificationsCommand,
  NotificationsHealth,
  NotificationsPort,
  NotificationsResult,
} from '../../ports/notifications.port';

@Injectable()
export class NotificationsSimulatorAdapter implements NotificationsPort {
  readonly kind: NotificationsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, NotificationsResult>();

  async health(): Promise<NotificationsHealth> {
    return { ok: true, domain: 'notifications', adapter: 'simulator' };
  }

  async execute(command: NotificationsCommand): Promise<NotificationsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: NotificationsResult = {
      referenceId: `sim-notifications-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: {
        simulated: true,
        principalId: command.principalId,
        payloadKeys: Object.keys(command.payload).sort(),
      },
    };
    this.ledger.set(command.idempotencyKey, result);
    return result;
  }
}
