import { Injectable } from '@nestjs/common';
import {
  OrdersAdapterKind,
  OrdersCommand,
  OrdersHealth,
  OrdersPort,
  OrdersResult,
} from '../../ports/orders.port';

@Injectable()
export class OrdersSimulatorAdapter implements OrdersPort {
  readonly kind: OrdersAdapterKind = 'simulator';
  private readonly ledger = new Map<string, OrdersResult>();

  async health(): Promise<OrdersHealth> {
    return { ok: true, domain: 'orders', adapter: 'simulator' };
  }

  async execute(command: OrdersCommand): Promise<OrdersResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: OrdersResult = {
      referenceId: `sim-orders-${command.idempotencyKey}`,
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
