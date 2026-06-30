import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  OrdersAdapterKind,
  OrdersCommand,
  OrdersHealth,
  OrdersPort,
  OrdersResult,
} from '../../ports/orders.port';

@Injectable()
export class OrdersProductionAdapter implements OrdersPort {
  readonly kind: OrdersAdapterKind = 'production';

  async health(): Promise<OrdersHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('orders', 'production');
  }

  async execute(_command: OrdersCommand): Promise<OrdersResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('orders', 'production');
  }
}
