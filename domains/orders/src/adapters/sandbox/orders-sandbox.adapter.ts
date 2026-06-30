import { Injectable } from '@nestjs/common';
import {
  OrdersAdapterKind,
  OrdersCommand,
  OrdersHealth,
  OrdersPort,
  OrdersResult,
} from '../../ports/orders.port';

@Injectable()
export class OrdersSandboxAdapter implements OrdersPort {
  readonly kind: OrdersAdapterKind = 'sandbox';
  private readonly store = new Map<string, OrdersResult>();

  async health(): Promise<OrdersHealth> {
    return { ok: true, domain: 'orders', adapter: 'sandbox' };
  }

  async execute(command: OrdersCommand): Promise<OrdersResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: OrdersResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
